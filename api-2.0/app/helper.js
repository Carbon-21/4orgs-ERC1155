"use strict";

const logger = require("../util/logger");
const fs = require("fs");
const path = require("path");
var { Gateway, Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const { exec } = require("child_process");
const util = require("util");
const HttpError = require("../util/http-error");

//connect to a channel and get a given chaincode
const getChaincode = async (org, channel, chaincodeName, username, next) => {
  try {
    // load the network configuration
    const ccp = await getCCP(org);

    // Create a new file system based wallet for managing identities.
    const walletPath = await getWalletPath(org);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    //TODO tirar isso quando docker for persistente
    // Check to see if we've already enrolled the user.
    let identity = await wallet.get(username);
    if (!identity) {
      logger.info(`An identity for the user ${username} does not exist in the wallet. Registering user...`);
      await getRegisteredUser(username, org, true);
      identity = await wallet.get(username);

      return;
    }

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: username,
      discovery: { enabled: true, asLocalhost: true },
    });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork(channel);

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName);

    //TODO o pavan deixou um TODO escondido aqui kkk
    // Important: Please dont set listener here, I just showed how to set it. If we are doing here, it will set on every invoke call.
    // Instead create separate function and call it once server started, it will keep listening.
    //Listen for new events emitted by the smart contract
    // await contract.addContractListener(contractListener);
    //Listen for new emitted block events
    // await network.addBlockListener(blockListener);
    return [contract, gateway];
  } catch (err) {
    logger.error(err);
    return next(new HttpError(500));
  }
};

const getAccountIdFromChaincode = async (chaincode, next) => {
  try {
    let result = await chaincode.submitTransaction("SmartContract:ClientAccountID");
    result = result.toString();

    // logger.debug("ClientAccountID retrieved: " + result);

    return result;
  } catch (err) {
    logger.error(err);
    return next(new HttpError(500));
  }
};

const getAccountId = async (channelName, chaincodeName, username, org_name, next) => {
  try {
    const ccp = await getCCP(org_name);

    const walletPath = await getWalletPath(org_name);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    //if account doesn't exist => error
    let identity = await wallet.get(username);
    if (!identity) {
      return next(new HttpError(422));
      // console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
      // await getRegisteredUser(username, org_name, true);
      // identity = await wallet.get(username);
      // console.log("Run the registerUser.js application before retrying");
      // return;
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

    // logger.debug("ClientAccountID retrieved: " + result);

    await gateway.disconnect();

    return result;
  } catch (err) {
    logger.error(err);
    return next(new HttpError(500));
  }
};

const getCCP = async (org) => {
  let ccpPath = null;
  org == "Carbon" ? (ccpPath = path.resolve(__dirname, "..", "config", "connection-carbon.json")) : null;
  org == "Users" ? (ccpPath = path.resolve(__dirname, "..", "config", "connection-users.json")) : null;
  org == "Cetesb" ? (ccpPath = path.resolve(__dirname, "..", "config", "connection-cetesb.json")) : null;
  org == "Ibama" ? (ccpPath = path.resolve(__dirname, "..", "config", "connection-ibama.json")) : null;
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

  
  const query = await identityService.getOne(username, adminUser);
  return query["result"];

};

const getRegisteredUser = async (username, userOrg, isJson) => {
  let ccp = await getCCP(userOrg);

  const caURL = await getCaUrl(userOrg, ccp);
  const ca = new FabricCAServices(caURL);

  const walletPath = await getWalletPath(userOrg);
  const wallet = await Wallets.newFileSystemWallet(walletPath);

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
    secret = await ca.register({ affiliation: await getAffiliation(userOrg), enrollmentID: username, role: "client" }, adminUser);
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
  console.log(`Successfully registered and enrolled admin user ${username} and imported it into the wallet`);

  var response = {
    success: true,
    message: username + " enrolled Successfully",
  };
  return response;
};

const isUserRegistered = async (username, userOrg) => {
  const walletPath = await getWalletPath(userOrg);
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const userIdentity = await wallet.get(username);
  if (userIdentity) {
    console.log(`An identity for the user ${username} exists in the wallet`);
    return true;
  }
  return false;
};

const isUserRegisteredInCA = async (username, userOrg) => {
  try {
    let user = await getRegisteredUserFromCA(username, userOrg);
    return true;
  } catch (err) {
    return false;
  }
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
  try {
    const caInfo = await getCaInfo(org, ccp); //ccp.certificateAuthorities['ca.carbon.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

    // Create a new file system based wallet for managing identities.
    const walletPath = await getWalletPath(org); //path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the admin user.
    const identity = await wallet.get("admin");
    if (identity) {
      console.log('An identity for the admin user "admin" already exists in the wallet');
      return;
    }

    // Enroll the admin user, and import the new identity into the wallet.
    const enrollment = await ca.enroll({ enrollmentID: process.env.ADMIN_ENROLLMENT_ID, enrollmentSecret: process.env.ADMIN_ENROLLMENT_SECRET });

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
      if (registeredUser["attrs"][i]["name"] == key) attribute = registeredUser["attrs"][i]["value"];
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

/**
 * Generates the client account id used in the chaincode methods. The current function helper.getAccountIdFromChaincode 
 * requires the caller's private key to be executed properly, therefore not being possible to sign transactions on the client side.
 * This present function is a temporary way to make Offline Transaction Signing Mode work while there is not another funcion in the chaincode that
 * doesn't require the user's private key.
 * @param {*} username The user's email.
 * @param {*} role The user's role (client or admin).
 * @param {*} org The user's organization.
 * @returns The user's client account id.
 */
async function mountClientAccountId(username, org, swapRoleOrgOrder) {
  
  let role = username.startsWith("admin") ? "admin" : "client";
  
  try
  {
    const user = await getRegisteredUserFromCA(username, org);
  } catch (err) {
    err.message = "O usuário fornecido não está registrado.";
    throw err;
  }
  
  let clientAccountId;

  if (swapRoleOrgOrder) {
    clientAccountId = `x509::CN=${username},OU=${org.toLowerCase()}+OU=${role.toLowerCase()}+OU=department1::CN=fabric-ca-server,OU=Fabric,O=Hyperledger,ST=North Carolina,C=US`;
  } else {
    clientAccountId = `x509::CN=${username},OU=${role.toLowerCase()}+OU=${org.toLowerCase()}+OU=department1::CN=fabric-ca-server,OU=Fabric,O=Hyperledger,ST=North Carolina,C=US`;
  }
  
  // Base-64 encoding of clientAccountId
  clientAccountId = btoa(clientAccountId);
  return clientAccountId;
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
  getAccountId,
  updateAttribute,
  queryAttribute,
  execWrapper,
  getOrgMSP,
  getChaincode,
  getAccountIdFromChaincode,
  mountClientAccountId,
  isUserRegisteredInCA,
};
