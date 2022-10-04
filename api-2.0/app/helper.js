"use strict";

var { Gateway, Wallets } = require("fabric-network");

const logger = require("../util/logger");
const path = require("path");
const FabricCAServices = require("fabric-ca-client");
const fs = require("fs");
const common = require("fabric-common");
const IdentityService = require("fabric-ca-client");

// Added to allow waiting generateCSR script execution
const { exec } = require("child_process");
const util = require("util");
//const { IdentityService }= require("fabric-ca-client");
const { User, Query, Client } = require("fabric-common");
const FabricClient = require('fabric-client');
const execPromise = util.promisify(exec);
const auth = require("../util/auth"); 
const Channel = require("fabric-common/lib/Channel");
const crypto = require("crypto");

const transactionBuffer = []
var globalChannel = null;

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
    console.log('user from CA: type ' + typeof query + '\n',query)
    let client = new Client(username);
    //let config = new Object();
    //config.enrollmentId = username;
    //config.affiliation = 'carbon.department1';
    //console.log('print=',config.enrollmentId)
    
    //let userTeste = new User(config);
    //let clientTeste = new Client(username);
    //console.log('### clienTeste ###\n',clientTeste)
    //let idx = clientTeste.newIdentityContext(userTeste);
    //console.log('### idx ###\n',idx)
    //console.log('#### userTeste #### =\n',userTeste);
    // let channel = new Channel('mychannel', clientTeste)
    // let endorsement = channel.newCommit('erc1155');
    // const build_options = {fcn: 'Mint', args: ['as', 'nft01', '100']};
    // const proposalBytes = endorsement.build(idx, build_options);
    // console.log('### proposalBytes ###', proposalBytes);
    //console.log('### channel ###\n',channel);
    //console.log('### endorsement ###\n',endorsement);
    // let teste = client.newIdentityContext(query)
    // console.log('idx teste:\n', teste)
    // //idx = new IdentityService()
    // //console.log(query['result'])
    return query["result"];
  } catch (error) {
    logger.error(`Getting error: ${error}`);
    return error.message;
  }
};

const getRegisteredUser = async (username, userOrg, isJson) => {
  let enrollmentSecret = username + "pw";
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
      { affiliation: await getAffiliation(userOrg), 
        enrollmentID: username,
        enrollmentSecret: username + "pw", //temporary 
        role: "client" 
      }, 
      adminUser
    );
    // const secret = await ca.register({ affiliation: 'carbon.department1', enrollmentID: username, role: 'client', attrs: [{ name: 'role', value: 'approver', ecert: true }] }, adminUser);
  } catch (error) {
    return error.message;
  }

  const enrollment = await ca.enroll(
    { enrollmentID: username, 
      enrollmentSecret: username + "pw"
    });
  // const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret, attr_reqs: [{ name: 'role', optional: false }] });

  let x509Identity = {
    credentials: {
      certificate: enrollment.certificate
      //privateKey: enrollment.key.toBytes(),
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

const registerAndGerSecret = async (user, useCSR, csr) => {
  let username = user.username;
  let userOrg = user.org;
  let email = user.email;
  let password = user.password;
  let cpf = user.cpf;
  let pkey;
  let ccp = await getCCP(userOrg);

  const caURL = await getCaUrl(userOrg, ccp);
  const ca = new FabricCAServices(caURL);
  console.log("ca name " + ca.getCaName());

  const walletPath = await getWalletPath(userOrg);
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  logger.debug(`Wallet path: ${walletPath}`);

  const userIdentity = await wallet.get(username);
  if (userIdentity) {
    logger.error(`An identity for the user ${username} already exists in the wallet`);
    var response = {
      success: true,
      token: auth.createJWT(user.username, user.org),
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
      {
        affiliation: await getAffiliation(userOrg),
        enrollmentID: user.username,
        enrollmentSecret: user.username + "pw",
        role: "client",
        attrs: [
          { name: "cpf", value: cpf },
          { name: "email", value: email },
          { name: "password", value: password },
        ],
      },
      adminUser
    );

    let pkey;

    if (useCSR == true) {
      logger.debug(`Using CSR mode`);
      logger.info('CSR:\n' + csr);
      var enrollment = await ca.enroll({
        enrollmentID: username,
        enrollmentSecret: username + "pw",
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

    let orgMSPId = getOrgMSP(userOrg);
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate
      },
      mspId: orgMSPId,
      type: "X.509",
    };
    await wallet.put(username, x509Identity);
  } catch (error) {
    return error.message;
  }

  var response = {
    success: true,
    message: username + " enrolled Successfully",
    token: auth.createJWT(user.username, user.org),
    secret: secret,
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

const digestTransaction = async(build_options, username, org_name, channelName) => {

}

const signTransaction = async(signature) => {
  let transaction = transactionBuffer.pop();
  transaction.sign(signature);
  console.log('get Endorser\n',globalChannel.getEndorsers("CarbonMSP"));
  let proposalResponse = await transaction.send({targets: globalChannel.getEndorsers()});
  console.log('### proposalResponse ###\n',proposalResponse); 
}

const str2ab = function (str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// const setupClient = async () => {
//   var client = FabricClient.loadFromConfig('../network_org1.yaml');
//   await client.initCredentialStores();
//   let channel = client.getChannel('mychannel')
//   return {client: client, channel:channel};
// }

exports.getRegisteredUser = getRegisteredUser;

module.exports = {
  getCCP: getCCP,
  getWalletPath: getWalletPath,
  getRegisteredUser: getRegisteredUser,
  getRegisteredUserFromCA: getRegisteredUserFromCA,
  isUserRegistered: isUserRegistered,
  registerAndGerSecret: registerAndGerSecret,
  getAccountId: getAccountId,
  updateAttribute: updateAttribute,
  queryAttribute: queryAttribute,
  digestTransaction: digestTransaction,
  signTransaction: signTransaction,
  str2ab: str2ab,
  //setupClient
};

async function execWrapper(cmd) {
  const { stdout, stderr } = await execPromise(cmd);
  if (stdout) {
    console.log(`stderr: ${stdout}`);
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
  }
}
