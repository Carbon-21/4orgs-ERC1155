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

const SALT_BYTES_LENGTH = 32;

module.exports = async (req, res, next) => {
  logger.trace("Entered createAdmin controller");

  const org = "Carbon";

  //get wallets' path for the given org and create wallet object
  const walletPath = await helper.getWalletPath(org);
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  //enroll an admin users if they doesn't exist yet
  let adminIdentity = await wallet.get("admin");
  if (!adminIdentity) {
    logger.info("No admin identities found, creating them...");

    //create "admin" identity in the blockchain
    try {
      const ccp = await helper.getCCP(org);
      await helper.enrollAdmin(org, ccp);
      adminIdentity = await wallet.get("admin");
    } catch (err) {
      logger.debug(err);
      return next(new HttpError(500));
    }

    //create a second admin identity, admin@admin.com, both in the blockchain and in the DB
    //instantiate admin user in the DB
    const seed = generateSeed();
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

    logger.info("Successfully enrolled admin and admin@admin.com");
  } else {
    logger.info("Admins already created, skipping creation...");
  }

  next();
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
const saveUserToDatabase = async (user, next) => {
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
    return next(new HttpError(500));
  }
};
