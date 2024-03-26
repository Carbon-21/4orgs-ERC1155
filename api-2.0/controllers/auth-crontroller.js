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
    logger.error(err)
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
  console.log(user);
  user.org = "Carbon";
  logger.debug("Username: " + user.email);

  //update user on DB
  let response = await saveUserToDatabase(user);
  // if (!response) return;
  if (!response) return next(new HttpError(500));

  //enroll user in the CA and save it in the wallet
  let enrollResponse = await enrollUserInCA(user);
  // if (!enrollResponse.success) return;
  if (!enrollResponse.success) return next(new HttpError(500));
  response.certificate = enrollResponse.certificate;

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
    console.log("procurando usuario", email);
    user = await models.users.findOne({
      where: { email },
    });
    console.log(user);
  } catch (err) {
    return next(new HttpError(500));
  }

  //password is stored in DB as a derivation from the PHS sent from the user, using their seed as salt.
  //derive it again so we can check if the given pwd is correct
  //note: this must be done even if the user doesn't exist, to avoid usernames sweeping via side channels attacks
  password = hkdf(password, user ? user.seed : process.env.WEED);

  //check username, status, pwd and org
  console.log("user password", user);
  console.log("user password", password);
  console.log("user ", user.password);
  if (!user || user.status !== "active" || user.password !== password || user.org !== org) {
    return next(new HttpError(401)); //login failed
  }

  //create jwt
  const token = auth.createJWT(email, org, email === process.env.ADMIN_LOGIN ? "admin" : "client");

  try {
    //send OK response
    return res.status(200).json({
      message: `Welcome!`,
      token,
      keyOnServer: user.keyOnServer, // Boolean that informs whether the user's key is stored on the server or not.
    });
  } catch (err) {
    logger.error(err);
    return next(new HttpError(500));
  }
};

//create two admins identities in the blockchain, admin and admin@admin.com. The latter is also created in the SQL DB
//called on app initialization. No route assigned.
exports.createAdmin = async () => {
  logger.trace("Entered createAdmin controller");

  const org = "Carbon";

  //get wallets' path for the given org and create wallet object
  const walletPath = await helper.getWalletPath(org);
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  
  //enroll an admin users if they doesn't exist yet
  let adminIdentity = await wallet.get("admin");
  logger.trace(adminIdentity);
  if (adminIdentity) {
    logger.info("No admin identities found, creating them...");

    //create "admin" identity in the blockchain
    try {
      const ccp = await helper.getCCP(org);
      await helper.enrollAdmin(org, ccp);
      adminIdentity = await wallet.get("admin");
    } catch (err) {
      logger.error(err);
      return new HttpError(500);
    }

    //create a second admin identity, admin@admin.com, both in the blockchain and in the DB
    //instantiate admin user in the DB
    const seed = generateSeed();
    logger.trace(seed);

    let admin = { email: process.env.ADMIN_LOGIN, seed, org };
    try {
      await models.users.create(admin);
    } catch (err) {
      logger.error(err);
      return new HttpError(500);
    }

    //PHS
    try {
      const salt = hkdf(process.env.ADMIN_LOGIN, seed);
      let password = await argon2.hash({ pass: process.env.ADMIN_PASSWORD, salt, hashLen: 32, type: argon2.ArgonType.Argon2id, time: 3, mem: 15625, parallelism: 1 });
      password = password.hashHex;
      admin.password = password;
    } catch (err) {
      logger.error(err);
      return new HttpError(500);
    }

    //update user on DBnrol
    let response = await saveUserToDatabase(admin);
    logger.trace(response);
    if (!response) return new HttpError(500);

    //enroll user in the CA and save it in the wallet
    if (!(await enrollUserInCA(admin, "admin"))) return new HttpError(500);

    logger.info("Successfully enrolled admin and admin@admin.com");
  }
  // else {
  //   logger.info("Admins already created, skipping creation...");
  // }
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

//caled on signup
const saveUserToDatabase = async (user) => {
  //get user object from DB, already created during getSalt()
  user.keyOnServer = user.saveKeyOnServer; // Boolean that informs whether the user's key is stored on the server or not.
  if (typeof user.keyOnServer !== "boolean") user.keyOnServer = true;
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
    // return next(new HttpError(500));
    return;
  }

  //if obj doesnt exist => error
  // if (!obj) return next(new HttpError(404));
  if (!obj) return;

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
    // return next(new HttpError(code, message));
    return;
  }

  //OK
  const response = {
    message: "Cadastrado realizado com sucesso!",
  };
  return response;
};

//register the user in the CA, enroll the user in the CA, and save the new identity into the wallet. Returns true if things went as expected.
const enrollUserInCA = async (user, role = "client") => {
  if (typeof user.saveKeyOnServer !== "boolean") user.saveKeyOnServer = true;
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

    return { success: false };
  }

  //build an admin user object (necessary for authenticating with the CA and thus enrolling a new user)
  let adminIdentity = await wallet.get("admin");
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, "admin");

  let secret;
  try {
    var certificate;

    //register user, using admin account
    secret = await ca.register(
      {
        affiliation: await helper.getAffiliation(user.org),
        enrollmentID: user.email,
        role,
      },
      adminUser
    );

    let privateKey;

    if (!user.saveKeyOnServer) {
      logger.debug(`--- Client-side Private Key and CSR Generation Mode ---`);

      //enroll user in the CA
      var enrollment = await ca.enroll({
        enrollmentID: user.email,
        enrollmentSecret: secret,
        csr: user.csr,
      });
      certificate = enrollment.certificate;
    } else {
      logger.debug(`--- Server-side Private Key and CSR Generation Mode ---`);

      var enrollment = await ca.enroll({
        enrollmentID: user.email,
        enrollmentSecret: secret,
      });
      privateKey = enrollment.key.toBytes();
      certificate = enrollment.certificate;
    }

    //save cert and privateKey to wallet
    //TODO sepa a privateKey tem que ser salva só quando CSR não é usado
    let orgMSPId = helper.getOrgMSP(user.org);
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
      },
      mspId: orgMSPId,
      type: "X.509",
    };

    // If user.saveKeyOnServer is true, saves user's server-side generated private key
    if (user.saveKeyOnServer) x509Identity.credentials.privateKey = privateKey;

    await wallet.put(user.email, x509Identity);

    //OK
    return { success: true, certificate: certificate };
  } catch (err) {
    //change user status in DB, so they can try to sign up again
    await models.users.update({ status: "registering" }, { where: { email: user.email } });

    //issue error
    logger.debug(err);
    // return next(new HttpError(500));
    return;
  }
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
