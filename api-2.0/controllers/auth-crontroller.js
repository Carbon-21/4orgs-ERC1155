const helper = require("../app/helper");
const logger = require("../util/logger");
const auth = require("../util/auth");
const models = require("../util/sequelize");
const HttpError = require("../util/http-error");
const crypto = require("crypto");
const fs = require("fs");
var { Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");

//.env
const weed = "0118a6dd0c8c93fbc4c49e4ad3a7ce57fe3d29e07ed7b249a55da6dd578d18e1";
const domain = "carbon21.com";

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
        logger.info(`User is being shady`);
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
        await models.users.create({ email, seed, salt });
      } catch (err) {
        logger.error(err);
        return next(new HttpError(500));
      }

      logger.info(`Salt created and returned`);
      return res.status(200).json({
        salt,
      });
    }
  }

  // login: return weeded (dummy) salt if user doesn't exist
  else {
    // TODO validar que é assim mesmo. faz sentiudo, para deixar o tempo de resposta igual nos dois cenários abaixo, no entanto é um procedimento desnecessário quando o usuário de fato existir.
    const weededSalt = hkdf(email, weed);

    if (user && user.status === "active") {
      logger.info(`Valid email, salt returned`);
      return res.status(200).json({
        salt: user.salt,
      });
    } else {
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
  let enrollResponse = await enrollUserInCA(user);
  if (!enrollResponse.success) return;
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
  logger.debug("Org: " + org);

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
    token = auth.createJWT(email, org);

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
      keyOnServer: user.keyOnServer
    });
  } catch (err) {
    logger.error(err);
    return next(new HttpError(500));
  }
};

//////////HELPER CALLS//////////
//derive key from seed. The derived key is used as salt to perform PHS, on the client side. It is then used on the server side to derive the PHS and store it in the password field (users table).
// TODO validar 4 chamadas (ordem dos parâmetros)
const hkdf = (ikm, salt) => {
  const derivedKey = crypto.hkdfSync("sha256", ikm, salt, domain, 11);
  return Buffer.from(derivedKey).toString("hex");
};

//generate 256 bit seed
const generateSeed = () => {
  const seed = crypto.randomBytes(32).toString("hex");
  return seed;
};

//caled on signup
const saveUserToDatabase = async (user, next) => {
  //get user object from DB, already created during getSalt()
  user.keyOnServer = user.saveKeyOnServer;
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
const enrollUserInCA = async (user) => {
  //get org CCP (its configs, such as CA path and tlsCACerts)
  let ccp = await helper.getCCP(user.org);

  //create CA object
  const caURL = await helper.getCaUrl(user.org, ccp);
  const ca = new FabricCAServices(caURL);
  // logger.debug("ca name " + ca.getCaName());
  // logger.debug("ca: ", ca);

  //get wallets' path for the given org and create wallet object
  const walletPath = await helper.getWalletPath(user.org);
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  // logger.debug(`Wallet path: ${walletPath}`);
  // logger.debug("wallet: ", wallet);

  //check if a wallet for the given user already exists
  const userIdentity = await wallet.get(user.email);
  if (userIdentity) {
    logger.error(`An identity for the user ${user.email} already exists in the wallet`);

    return {success:false, err: "Usuário já cadastrado"};
  }

  //enroll an admin user if it doesn't exist yet
  let adminIdentity = await wallet.get("admin");
  if (!adminIdentity) {
    logger.info('An identity for the admin user "admin" does not exist in the wallet');

    await helper.enrollAdmin(user.org, ccp);
    adminIdentity = await wallet.get("admin");

    logger.info("Admin Enrolled Successfully");
  }

  //build an admin user object (necessary for authenticating with the CA and thus enrolling a new user)
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
        role: "client",
      },
      adminUser
    );

    let pkey;

    if (!user.saveKeyOnServer) {
      logger.debug(`--- Client-side Private Key and CSR Generation Mode ---`);

      //enroll user in the CA
      var enrollment = await ca.enroll({
        enrollmentID: user.email,
        enrollmentSecret: secret,
        csr: user.csr,
      });
      certificate = enrollment.certificate;
    }

    else {
      logger.debug(`--- Server-side Private Key and CSR Generation Mode ---`);

      var enrollment = await ca.enroll({
        enrollmentID: user.email,
        enrollmentSecret: secret,
      });
      pkey = enrollment.key.toBytes();
      certificate = enrollment.certificate
    }

    //save cert and pkey to wallet
    //TODO sepa a pkey tem que ser salva só quando CSR não é usado
    let orgMSPId = helper.getOrgMSP(user.org);
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
      },
      mspId: orgMSPId,
      type: "X.509",
    };

    // If user.saveKeyOnServer is true, saves user's server-side generated private key
    if (user.saveKeyOnServer) x509Identity.credentials.privateKey = pkey;

    await wallet.put(user.email, x509Identity);

    //OK
    return {success: true, certificate: certificate};
  } catch (err) {
    //change user status in DB, so they can try to sign up again
    await models.users.update({ status: "registering" }, { where: { email: user.email } });

    //issue error
    logger.debug(err);
    return {success: false, err: err.message}
  }
};
