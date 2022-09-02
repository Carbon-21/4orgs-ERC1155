"use strict";

const logger = require("../util/logger");
const models = require("../util/sequelize");
const HttpError = require("../util/http-error");
const auth = require("../util/auth");
const fs = require("fs");
const path = require("path");
var { Gateway, Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const crypto = require("crypto");
const { exec } = require("child_process");
const util = require("util");

const domain = "carbon21.com";

const getAccountId = async (channelName, chaincodeName, username, org_name) => {
  try {
    const ccp = await getCCP(org_name);

    const walletPath = await getWalletPath(org_name);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    logger.debug(`Wallet path: ${walletPath}`);

    //TODO após estudar wallets, temos que olhar se isso aqui será mantido
    let identity = await wallet.get(username);
    if (!identity) {
      console.log(
        `An identity for the user ${username} does not exist in the wallet, so registering user`
      );
      await getRegisteredUser(username, org_name, true);
      identity = await wallet.get(username);
      console.log("Run the registerUser.js application before retrying");
      return;
    }

    const connectOptions = {
      wallet,
      identity: username,
      discovery: { enabled: true, asLocalhost: true },
      // eventHandlerOptions: EventStrategies.NONE
    };

    const gateway = new Gateway();
    await gateway.connect(ccp, connectOptions);

    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);

    let result = await contract.submitTransaction("SmartContract:ClientAccountID");
    result = result.toString();

    logger.debug("Destiny ClientAccountID retrieved: " + result);

    await gateway.disconnect();

    return result;
  } catch (error) {
    logger.error(`Getting error: ${error}`);
    return error.message;
  }
};

const getCCP = async (org) => {
  let ccpPath = null;
  org == "Carbon"
    ? (ccpPath = path.resolve(__dirname, "..", "config", "connection-carbon.json"))
    : null;
  org == "Users"
    ? (ccpPath = path.resolve(__dirname, "..", "config", "connection-users.json"))
    : null;
  org == "Cetesb"
    ? (ccpPath = path.resolve(__dirname, "..", "config", "connection-cetesb.json"))
    : null;
  org == "Ibama"
    ? (ccpPath = path.resolve(__dirname, "..", "config", "connection-ibama.json"))
    : null;
  const ccpJSON = fs.readFileSync(ccpPath, "utf8");
  const ccp = JSON.parse(ccpJSON);
  return ccp;
};

const getCaUrl = async (org, ccp) => {
  let caURL = null;
  org == "Carbon" ? (caURL = ccp.certificateAuthorities["ca.carbon.example.com"].url) : null;
  org == "Users" ? (caURL = ccp.certificateAuthorities["ca.users.example.com"].url) : null;
  org == "Cetesb" ? (caURL = ccp.certificateAuthorities["ca.cetesb.example.com"].url) : null;
  org == "Ibama" ? (caURL = ccp.certificateAuthorities["ca.ibama.example.com"].url) : null;
  return caURL;
};

const getWalletPath = async (org) => {
  let walletPath = null;
  org == "Carbon" ? (walletPath = path.join(process.cwd(), "carbon-wallet")) : null;
  org == "Users" ? (walletPath = path.join(process.cwd(), "users-wallet")) : null;
  org == "Cetesb" ? (walletPath = path.join(process.cwd(), "cetesb-wallet")) : null;
  org == "Ibama" ? (walletPath = path.join(process.cwd(), "ibama-wallet")) : null;
  return walletPath;
};

const getAffiliation = async (org) => {
  // Default in ca config file we have only two affiliations, if you want ti use cetesb ca, you have to update config file with third affiliation
  //  Here already two Affiliation are there, using i am using "users.department1" even for cetesb
  return org == "Carbon" ? "carbon.department1" : "users.department1";
};

/**
 * Checks whether a username is registered in an Organization's CA directly, not seeing the wallet level.
 */
const getRegisteredUserFromCA = async (username, org) => {
  //username = user.username;
  //org = user.org;

  let ccp = await getCCP(org);

  const caURL = await getCaUrl(org, ccp);
  const ca = new FabricCAServices(caURL, undefined, "ca.carbon.example.com");
  console.log("ca name " + ca.getCaName());
  const identityService = await ca.newIdentityService();

  const walletPath = await getWalletPath(org);
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  // Check to see if we've already enrolled the admin user.
  let adminIdentity = await wallet.get("admin");
  if (!adminIdentity) {
    console.log('An identity for the admin user "admin" does not exist in the wallet');
    await enrollAdmin(org, ccp);
    adminIdentity = await wallet.get("admin");
    console.log("Admin Enrolled Successfully");
  }

  // build a user object for authenticating with the CA
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, "admin");

  try {
    const query = await identityService.getOne(username, adminUser);
    //console.log(query['result'])
    return query["result"];
  } catch (error) {
    logger.error(`Getting error: ${error}`);
    return error.message;
  }
};

const getRegisteredUser = async (username, userOrg, isJson) => {
  let ccp = await getCCP(userOrg);

  const caURL = await getCaUrl(userOrg, ccp);
  console.log("ca url is ", caURL);
  const ca = new FabricCAServices(caURL);

  const walletPath = await getWalletPath(userOrg);
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  console.log(`Wallet path: ${walletPath}`);

  const userIdentity = await wallet.get(username);
  if (userIdentity) {
    console.log(`An identity for the user ${username} already exists in the wallet`);
    var response = {
      success: true,
      message: username + " enrolled Successfully",
    };
    return response;
  }

  // Check to see if we've already enrolled the admin user.
  let adminIdentity = await wallet.get("admin");
  if (!adminIdentity) {
    console.log('An identity for the admin user "admin" does not exist in the wallet');
    await enrollAdmin(userOrg, ccp);
    adminIdentity = await wallet.get("admin");
    console.log("Admin Enrolled Successfully");
  }

  // build a user object for authenticating with the CA
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, "admin");
  let secret;
  try {
    // Register the user, enroll the user, and import the new identity into the wallet.
    secret = await ca.register(
      { affiliation: await getAffiliation(userOrg), enrollmentID: username, role: "client" },
      adminUser
    );
    // const secret = await ca.register({ affiliation: 'carbon.department1', enrollmentID: username, role: 'client', attrs: [{ name: 'role', value: 'approver', ecert: true }] }, adminUser);
  } catch (error) {
    return error.message;
  }

  const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret });
  // const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret, attr_reqs: [{ name: 'role', optional: false }] });

  let x509Identity = {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: `${userOrg}MSP`,
    type: "X.509",
  };
  await wallet.put(username, x509Identity);
  console.log(
    `Successfully registered and enrolled admin user ${username} and imported it into the wallet`
  );

  var response = {
    success: true,
    message: username + " enrolled Successfully",
  };
  return response;
};

const isUserRegistered = async (username, userOrg) => {
  const walletPath = await getWalletPath(userOrg);
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  console.log(`Wallet path: ${walletPath}`);

  const userIdentity = await wallet.get(username);
  if (userIdentity) {
    console.log(`An identity for the user ${username} exists in the wallet`);
    return true;
  }
  return false;
};

const getCaInfo = async (org, ccp) => {
  let caInfo = null;
  org == "Carbon" ? (caInfo = ccp.certificateAuthorities["ca.carbon.example.com"]) : null;
  org == "Users" ? (caInfo = ccp.certificateAuthorities["ca.users.example.com"]) : null;
  org == "Cetesb" ? (caInfo = ccp.certificateAuthorities["ca.cetesb.example.com"]) : null;
  org == "Ibama" ? (caInfo = ccp.certificateAuthorities["ca.ibama.example.com"]) : null;
  return caInfo;
};

const getOrgMSP = (org) => {
  let orgMSP = null;
  org == "Carbon" ? (orgMSP = "CarbonMSP") : null;
  org == "Users" ? (orgMSP = "UsersMSP") : null;
  org == "Cetesb" ? (orgMSP = "CetesbMSP") : null;
  org == "Ibama" ? (orgMSP = "IbamaMSP") : null;
  return orgMSP;
};

const enrollAdmin = async (org, ccp) => {
  console.log("calling enroll Admin method");
  try {
    const caInfo = await getCaInfo(org, ccp); //ccp.certificateAuthorities['ca.carbon.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );

    // Create a new file system based wallet for managing identities.
    const walletPath = await getWalletPath(org); //path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the admin user.
    const identity = await wallet.get("admin");
    if (identity) {
      console.log('An identity for the admin user "admin" already exists in the wallet');
      return;
    }

    // Enroll the admin user, and import the new identity into the wallet.
    const enrollment = await ca.enroll({ enrollmentID: "admin", enrollmentSecret: "adminpw" });
    console.log("Enrollment object is : ", enrollment);
    let x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: `${org}MSP`,
      type: "X.509",
    };

    await wallet.put("admin", x509Identity);
    console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
    return;
  } catch (error) {
    console.error(`Failed to enroll admin user "admin": ${error}`);
  }
};

//deprecated: see auth-controller.js (signup())
const registerAndGetSecret = async (user, useCSR, next) => {
  const username = user.username;
  const userOrg = user.org;
  let token;
  // let email = user.email;
  // let password = user.password;
  // let cpf = user.cpf;

  //get org CCP (its configs, such as CA path and tlsCACerts)
  let ccp = await getCCP(userOrg);

  //create CA object
  const caURL = await getCaUrl(userOrg, ccp);
  const ca = new FabricCAServices(caURL);
  logger.debug("ca name " + ca.getCaName());
  logger.debug("ca: ", ca);

  //get wallets' path for the given org and create wallet object
  const walletPath = await getWalletPath(userOrg);
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  logger.debug(`Wallet path: ${walletPath}`);
  logger.debug("wallet: ", wallet);

  //check if a wallet for the given user already exists
  const userIdentity = await wallet.get(username);
  if (userIdentity) {
    logger.error(`An identity for the user ${username} already exists in the wallet`);

    token = auth.createJWT(username, userOrg);
    var response = {
      success: true,
      token,
      message: username + " enrolled Successfully",
    };
    return response;
  }

  //check to see if wea lready have an admin user
  let adminIdentity = await wallet.get("admin");
  if (!adminIdentity) {
    logger.info('An identity for the admin user "admin" does not exist in the wallet');
    await enrollAdmin(userOrg, ccp);
    adminIdentity = await wallet.get("admin");
    logger.info("Admin Enrolled Successfully");
  }

  //build an admin user object (necessary for authenticating with the CA and thus enrolling a new user)
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, "admin");

  //register the user, enroll the user, and import the new identity into the wallet.
  let secret;
  try {
    secret = await ca.register(
      {
        affiliation: await getAffiliation(userOrg),
        enrollmentID: user.username,
        role: "client",
        // attrs: [
        //   { name: "cpf", value: cpf },
        //   { name: "email", value: email },
        //   { name: "password", value: password },
        // ],
      },
      adminUser
    );

    if (useCSR) {
      logger.debug(`Using CSR mode`);

      // Gera chave privada localmente. Aqui ainda salva dentro da API. Ideal é que ao gerar o usuário decida onde salvar a chave.
      // TODO: substituir o script por uma rotina em js

      //  Gera o CSR a partir do username e Org
      //  Precisa ter openssl instalado
      //  Script gera uma chave privada (salva em ./api-2.0/pkey.pem) e a partir dela um CSR (./api-2.0/certreq.csr)
      //  Common Name (CN) = username
      //  Org. Unit (OU) = client.userOrg.department1
      var command = "./generateCSR.sh " + username + " " + userOrg;
      await execWrapper(command);

      // // Le o csr gerado e adiciona no enroll
      const csr = fs.readFileSync("./certreq.csr", "utf8");
      // Le a pkey para add na wallet
      var pkey = fs.readFileSync("./pkey.pem", "utf8");
      logger.debug(`certreq:  ${csr}`);
      var enrollment = await ca.enroll({
        enrollmentID: username,
        enrollmentSecret: secret,
        csr: csr,
      });
    } else {
      logger.debug(`NOT using CSR mode`);
      var enrollment = await ca.enroll({
        enrollmentID: username,
        enrollmentSecret: secret,
      });
      pkey = enrollment.key.toBytes();
    }

    //save cert and pkey to wallet
    //TODO sepa a pkey tem que ser salva só quando CSR não é usado
    let orgMSPId = getOrgMSP(userOrg);
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: pkey,
      },
      mspId: orgMSPId,
      type: "X.509",
    };
    await wallet.put(username, x509Identity);

    /////////
    //get user object from DB, already created during getSalt()
    let obj;
    try {
      obj = await models.users.findOne({
        where: {
          email: username,
          status: "registering",
        },
      });
    } catch (err) {
      return next(new HttpError(500));
    }

    //check if obj exists
    if (obj == null) return next(new HttpError(404));

    //complete user info on DB
    try {
      //password is stored in DB as a derivation from the PHS sent from the user, using their seed as salt.
      user.password = Buffer.from(
        crypto.hkdfSync("sha256", user.password, obj.seed, domain, 32)
      ).toString("hex");

      //update user object with new info sent from client
      //TODO mudar para pending quando houver validação de conta por email
      obj.status = "active";
      Object.assign(obj, user);
      console.log(obj);
      await obj.save();
      // return res.status(200).json(filterData(obj));
    } catch (err) {
      logger.error(err);

      //throw error if user exists (409) or 500
      // let code;
      // err.parent.errno == 1062 ? (code = 409) : (code = 500);
      return next(new HttpError(code));
    }
  } catch (error) {
    return error.message;
  }
  token = auth.createJWT(username, userOrg);

  var response = {
    success: true,
    message: username + " enrolled Successfully",
    token,
    // secret: secret,
    certificate: enrollment.certificate,
  };
  return response;
};

/**
 * Updates a user's attribute within its CA's database. The attribute is identified by its key. If the provided key doesn't exist in the database,
 * it is created and receives the value provided. If it already exists, the value in the database is overwritten by the value provided as argument.
 */
const updateAttribute = async (username, org, key, value) => {
  logger.info("entered updateAttribute");
  let ccp = await getCCP(org);
  const caURL = await getCaUrl(org, ccp);
  const ca = new FabricCAServices(caURL);
  console.log("ca name " + ca.getCaName());
  const identityService = await ca.newIdentityService();
  const walletPath = await getWalletPath(org);
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  // Check to see if we've already enrolled the admin user.
  let adminIdentity = await wallet.get("admin");
  if (!adminIdentity) {
    console.log('An identity for the admin user "admin" does not exist in the wallet');
    await enrollAdmin(org, ccp);
    adminIdentity = await wallet.get("admin");
    console.log("Admin Enrolled Successfully");
  }

  // build a user object for authenticating with the CA
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, "admin");

  identityService.update(username, { attrs: [{ name: key, value: value }] }, adminUser);
};
/**
 * * Queries a desired attribute by its key from a registered user. The attribute is stored together with the user's information in the CA's database.
 */
const queryAttribute = async (username, org, key) => {
  let registeredUser = await getRegisteredUserFromCA(username, org);
  if (typeof registeredUser === "string") throw new Error(`Username ${username} is not registered`);

  let attribute = null;
  if (typeof registeredUser !== "string") {
    // Fetches the user's registered password
    for (let i = 0; i < registeredUser["attrs"].length && attribute == null; i++) {
      if (registeredUser["attrs"][i]["name"] == key)
        attribute = registeredUser["attrs"][i]["value"];
    }
  }
  return attribute;
};

async function execWrapper(cmd) {
  const execPromise = util.promisify(exec);
  const { stdout, stderr } = await execPromise(cmd);
  if (stdout) {
    console.log(`stderr: ${stdout}`);
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
  }
}

module.exports = {
  getCaUrl,
  getAffiliation,
  getCCP,
  getWalletPath,
  enrollAdmin,
  getRegisteredUser,
  getRegisteredUserFromCA,
  isUserRegistered,
  registerAndGetSecret,
  getAccountId,
  updateAttribute,
  queryAttribute,
  execWrapper,
  getOrgMSP,
};
