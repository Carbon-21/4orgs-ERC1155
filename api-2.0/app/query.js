const { Gateway, Wallets } = require("fabric-network");

const logger = require("../util/logger");

const helper = require("./helper");

const query = async (channelName, chaincodeName, args, fcn, username, org_name) => {
  try {
    // load the network configuration
    // const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');
    // const ccpJSON = fs.readFileSync(ccpPath, 'utf8')
    const ccp = await helper.getCCP(org_name); //JSON.parse(ccpJSON);

    // Create a new file system based wallet for managing identities.
    const walletPath = await helper.getWalletPath(org_name); //.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    logger.debug(`Wallet path: ${walletPath}`);

    //TODO após estudar wallets, temos que olhar se isso aqui será mantido
    // Check to see if we've already enrolled the user.
    let identity = await wallet.get(username);
    if (!identity) {
      logger.log(
        `An identity for the user ${username} does not exist in the wallet, so registering user`
      );
      await helper.getRegisteredUser(username, org_name, true);
      identity = await wallet.get(username);
      console.log("Run the registerUser.js application before retrying");
      return;
    }
    console.log(identity);

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: username,
      discovery: { enabled: true, asLocalhost: true },
    });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName);
    let result;
    switch (fcn) {
      case "BalanceOf":
        const clientAccountId = await helper.getAccountId(
          channelName,
          chaincodeName,
          args[0],
          org_name
        );

        result = await contract.evaluateTransaction(
          "SmartContract:" + fcn,
          clientAccountId,
          args[1]
        );
        break;
      default:
        break;
    }

    logger.info(`Transaction has been evaluated, result is: ${result.toString()}`);

    result = JSON.parse(result.toString());
    return result;
  } catch (error) {
    logger.error(`Failed to evaluate transaction: ${error}`);
    return error.message;
  }
};

exports.query = query;
