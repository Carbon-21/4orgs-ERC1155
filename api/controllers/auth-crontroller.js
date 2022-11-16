const helper = require("../app/helper");
const logger = require("../util/logger");
const auth = require("../util/auth");
const models = require("../util/sequelize");
const HttpError = require("../util/http-error");
const crypto = require("crypto");
const fs = require("fs");
var { Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const argon2 = require("argon2-browser");

//////////////CONSTANTS//////////////
const SALT_BYTES_LENGTH = 32;
// const BCRYPT_ALGORITHM = "$2a";
// const BCRYPT_ROUNDS = "$11$";

//////////DIRECT API CALLS//////////
//given the username, return a salt so the user can perform the PHS
exports.getSalt = async (req, res, next) => {
  logger.trace("Entered getSalt controller");

  const email = req.body.email;
  const isSignUp = req.body.isSignUp;
  logger.debug(`Email: ${email}, isSignUp: ${isSignUp}`);

  //look for user with given email
  let user;
  try {
    user = await models.users.findOne({
      where: { email },
    });
  } catch (err) {
    return next(new HttpError(500));
  }

  if (isSignUp) {
    if (user) {
      //user already registering/signing up => return salt
      if (user.status === "registering") {
        logger.info(`User already registering, previously created salt returned`);

        return res.status(200).json({
          salt: user.salt,
        });
      }
      //user already exists and its not still registering/signing up => error
      else {
        logger.warn(`User is being shady`);
        return next(new HttpError(409));
      }
    }
    //user doesn't exist yet
    else {
      //generate random seed and derive a key (salt) from it, using HKDF. This will be sent to the user so they can use it as salt to perform PHS
      const seed = generateSeed();
      const salt = hkdf(email, seed);

      //add PHS info to DB
      try {
        await models.users.create({ email, seed });
      } catch (err) {
        logger.error(err);
        return next(new HttpError(500));
      }

      return res.status(200).json({
        salt,
      });
    }
  }

  // login: return weeded (dummy) salt if user doesn't exist
  else {
    if (user && user.status === "active") {
      const salt = hkdf(email, user.seed);

      logger.info(`Valid email, salt returned`);
      return res.status(200).json({
        salt,
      });
    } else {
      const weededSalt = hkdf(email, process.env.WEED);

      logger.info(`Unknown email, weeded salt returned`);
      return res.status(200).json({
        salt: weededSalt,
      });
    }
  }
};

exports.signup = async (req, res, next) => {
  logger.trace("Entered signup controller");

  const user = req.body;
  user.org = "Carbon";
  logger.debug("Username: " + user.email);

  //update user on DB
  let response = await saveUserToDatabase(user, next);
  if (!response) return;

  //enroll user in the CA and save it in the wallet
  if (!(await enrollUserInCA(user, next))) return;

  //create JWT, add to reponse
  response.token = auth.createJWT(user.email, user.org);

  res.json(response);
};

exports.login = async (req, res, next) => {
  logger.trace("Entered login controller");

  const org = "Carbon"; // hardcoded
  const email = req.body.email;
  let password = req.body.password;

  logger.debug("Email: " + email);
  logger.debug("Password: " + password);

  //look for user with given email
  let user;
  try {
    user = await models.users.findOne({
      where: { email },
    });
  } catch (err) {
    return next(new HttpError(500));
  }

  //user doesnt exist => error
  //registering means that the signup process wasn't complete
  if (!user || user.status === "registering") {
    return next(new HttpError(401));
  }

  //user registering  => error
  if (user.status === "pending") {
    return next(new HttpError(403, "Por favor, confirme seu cadastro via email."));
  }

  //on a shell, user must be active
  if (user.status !== "active") {
    return next(new HttpError(412, "Usuário inativo. Contate o suporte para mais informações."));
  }

  //password is stored in DB as a derivation from the PHS sent from the user, using their seed as salt.
  //derive it again so we can check if the given pwd is correct
  password = hkdf(password, user.seed);

  //if pwd doesnt match or org isnt carbon => log this activity and don't authenticate
  if (user.password !== password || user.org !== org) {
    logger.info("Credentials do not match");

    //log activity
    try {
      await models.authenticationLog.create({
        userId: user.id,
        success: false,
        eventType: "login",
      });
    } catch (err) {
      return next(new HttpError(500));
    }

    //login failed due to wrong pwd
    return next(new HttpError(401));
  }

  let token;
  try {
    //create jwt
    token = auth.createJWT(email, org, email === process.env.ADMIN_LOGIN ? "admin" : "client");

    //log succesful login
    await models.authenticationLog.create({
      userId: user.id,
      success: true,
      eventType: "login",
    });

    //send OK response
    return res.status(200).json({
      message: `Welcome!`,
      token,
    });
  } catch (err) {
    logger.error(err);
    return next(new HttpError(500));
  }
};

//////////HELPER CALLS//////////
//derive 128-bit key. The derived key (email,seed) is used as salt to perform PHS, on the client side. This functions is then used again on (PHS,seed) and the derivation is saved as the password (user table in the DB).
const hkdf = (ikm, salt) => {
  const derivedKey = crypto.hkdfSync("sha256", ikm, salt, process.env.HKDF_INFO, SALT_BYTES_LENGTH);
  return Buffer.from(derivedKey).toString("hex");
};

//generate 128-bit seed
const generateSeed = () => {
  const seed = crypto.randomBytes(SALT_BYTES_LENGTH).toString("hex");
  return seed;
};

//create admin@admin.com in the blockchain ans in the DB
createAdmin = async (next) => {
  logger.trace("Entered createAdmin controller");
  const org = "Carbon";
  const seed = generateSeed();

  //instantiate admin user in the DB
  let admin = { email: process.env.ADMIN_LOGIN, seed, org };
  try {
    await models.users.create(admin);
  } catch (err) {
    return next(new HttpError(500));
  }

  //PHS
  try {
    const salt = hkdf(process.env.ADMIN_LOGIN, seed);
    let password = await argon2.hash({ pass: process.env.ADMIN_PASSWORD, salt, hashLen: 32, type: argon2.ArgonType.Argon2id, time: 3, mem: 15625, parallelism: 1 });
    password = password.hashHex;
    admin.password = password;
  } catch (err) {
    return next(new HttpError(500));
  }

  //update user on DB
  let response = await saveUserToDatabase(admin, next);
  if (!response) return;

  //enroll user in the CA and save it in the wallet
  if (!(await enrollUserInCA(admin, next, "admin"))) return;

  return true;
};

//caled on signup
const saveUserToDatabase = async (user, next) => {
  //get user object from DB, already created during getSalt()
  let obj;
  try {
    obj = await models.users.findOne({
      where: {
        email: user.email,
        status: "registering",
      },
    });
  } catch (err) {
    logger.error(err);
    return next(new HttpError(500));
  }

  //if obj doesnt exist => error
  if (!obj) return next(new HttpError(404));

  //complete user info on DB
  try {
    //password is stored in DB as a derivation from the PHS sent from the user, using their seed as salt.
    user.password = hkdf(user.password, obj.seed);

    //update object with info sent from client (merge obj and user)
    //TODO mudar para pending quando houver validação de conta por email
    obj.status = "active";
    Object.assign(obj, user);

    //save on DB
    await obj.save();
  } catch (err) {
    logger.error(err);
    let code, message;
    err.parent.errno == 1062 ? ((code = 409), (message = "CPF já cadastrado")) : (code = 500);
    return next(new HttpError(code, message));
  }

  //OK
  const response = {
    message: "Cadastrado realizado com sucesso!",
  };
  return response;
};

//register the user in the CA, enroll the user in the CA, and save the new identity into the wallet. Returns true if things went as expected.
const enrollUserInCA = async (user, next, role = "client") => {
  //get org CCP (its configs, such as CA path and tlsCACerts)
  let ccp = await helper.getCCP(user.org);

  //create CA object
  const caURL = await helper.getCaUrl(user.org, ccp);
  const ca = new FabricCAServices(caURL);

  //get wallets' path for the given org and create wallet object
  const walletPath = await helper.getWalletPath(user.org);
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  //check if a wallet for the given user already exists
  const userIdentity = await wallet.get(user.email);
  if (userIdentity) {
    logger.error(`An identity for the user ${user.email} already exists in the wallet`);

    return true;
  }

  //enroll an admin users if they doesn't exist yet
  let adminIdentity = await wallet.get("admin");
  if (!adminIdentity) {
    logger.info('An identity for the admin user "admin" does not exist in the wallet');

    try {
      //add admin user to the blockchain
      await helper.enrollAdmin(user.org, ccp);
      adminIdentity = await wallet.get("admin");
    } catch (err) {
      logger.debug(err);
      return next(new HttpError(500));
    }

    //create a second admin identity, admin@admin.com, both in the blockchain and in the DB
    let response = createAdmin(next);
    if (!response) return;

    logger.info("Admin Enrolled Successfully");
  }

  //build an admin user object (necessary for authenticating with the CA and thus enrolling a new user)
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, "admin");

  let secret;
  try {
    //register user, using admin account
    secret = await ca.register(
      {
        affiliation: await helper.getAffiliation(user.org),
        enrollmentID: user.email,
        role,
      },
      adminUser
    );

    //CSR
    if (user.useCSR) {
      logger.debug(`Using CSR mode`);

      //generate private key
      // TODO: tirar isso quando a geração no front estiver ok
      var command = "./generateCSR.sh " + user.email + " " + user.org;
      await helper.execWrapper(command);

      const csr = fs.readFileSync("./certreq.csr", "utf8");
      var pkey = fs.readFileSync("./pkey.pem", "utf8");
      logger.debug(`certreq:  ${csr}`);

      //enroll user in the CA
      var enrollment = await ca.enroll({
        enrollmentID: user.email,
        enrollmentSecret: secret,
        csr: csr,
      });
    }

    //Not CSR: just enroll user in the CA
    else {
      logger.debug(`NOT using CSR mode`);

      var enrollment = await ca.enroll({
        enrollmentID: user.email,
        enrollmentSecret: secret,
      });
      pkey = enrollment.key.toBytes();
    }

    //save cert and pkey to wallet
    //TODO sepa a pkey tem que ser salva só quando CSR não é usado
    let orgMSPId = helper.getOrgMSP(user.org);
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: pkey,
      },
      mspId: orgMSPId,
      type: "X.509",
    };
    await wallet.put(user.email, x509Identity);
  } catch (err) {
    //change user status in DB, so they can try to sign up again
    await models.users.update({ status: "registering" }, { where: { email: user.email } });

    //issue error
    logger.debug(err);
    return next(new HttpError(500));
  }

  //OK
  return true;
};

//transform 128-bit salt to bcrypt standard salt
//bcrypt salt = PHS algorithm + # round + b64 of the 128-bit salt
// const generateBcryptSalt = (originalSalt) => {
//   const saltBufer = Buffer.from(originalSalt, "hex");
//   const b64Salt = base64_encode(saltBufer, SALT_BYTES_LENGTH);

//   const bcryptSalt = BCRYPT_ALGORITHM + BCRYPT_ROUNDS + b64Salt;
//   return bcryptSalt;
// };

//transform buffer b of len bytes to b64 (bcrypt)
// const base64_encode = (b, len) => {
//   const BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
//   var off = 0,
//     rs = [],
//     c1,
//     c2;
//   if (len <= 0 || len > b.length) throw Error("Illegal len: " + len);
//   while (off < len) {
//     c1 = b[off++] & 0xff;
//     rs.push(BASE64_CODE[(c1 >> 2) & 0x3f]);
//     c1 = (c1 & 0x03) << 4;
//     if (off >= len) {
//       rs.push(BASE64_CODE[c1 & 0x3f]);
//       break;
//     }
//     c2 = b[off++] & 0xff;
//     c1 |= (c2 >> 4) & 0x0f;
//     rs.push(BASE64_CODE[c1 & 0x3f]);
//     c1 = (c2 & 0x0f) << 2;
//     if (off >= len) {
//       rs.push(BASE64_CODE[c1 & 0x3f]);
//       break;
//     }
//     c2 = b[off++] & 0xff;
//     c1 |= (c2 >> 6) & 0x03;
//     rs.push(BASE64_CODE[c1 & 0x3f]);
//     rs.push(BASE64_CODE[c2 & 0x3f]);
//   }
//   return rs.join("");
// };