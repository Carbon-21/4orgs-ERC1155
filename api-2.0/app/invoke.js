const { Gateway, Wallets } = require("fabric-network");

const logger = require("../util/logger");
const helper = require("./helper");
const { blockListener, contractListener } = require("./Listeners");

const invokeTransaction = async (
  channelName,
  chaincodeName,
  fcn,
  args,
  username,
  org_name,
  transientData
) => {
  try {
    const ccp = await helper.getCCP(org_name);

    const walletPath = await helper.getWalletPath(org_name);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    logger.debug(`Wallet path: ${walletPath}`);

    //pbc comentei pois achei estranho
    let identity = await wallet.get(username);
    if (!identity) {
      console.log(
        `An identity for the user ${username} does not exist in the wallet, so registering user`
      );
      await helper.getRegisteredUser(username, org_name, true);
      identity = await wallet.get(username);
      console.log("Run the registerUser.js application before retrying");
      return;
    }

    const connectOptions = {
      wallet,
      identity: identity,
      discovery: { enabled: true, asLocalhost: true },
      // eventHandlerOptions: EventStrategies.NONE
    };

    const gateway = new Gateway();
    await gateway.connect(ccp, connectOptions);

    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);

    // Important: Please dont set listener here, I just showed how to set it. If we are doing here, it will set on every invoke call.
    // Instead create separate function and call it once server started, it will keep listening.
    await contract.addContractListener(contractListener);
    await network.addBlockListener(blockListener);

    // Multiple smartcontract in one chaincode
    let result;
    let message;

    switch (fcn) {
      // mam: removi o username dos argumentos passados para as transações, pois o correto é utilizar o ClientID, que pode ser obtido por meio da função ClientAccountID
      // assim, agora esse argumento deve ser passado junto aos argumentos da chamada.
      case "Mint":
        result = await contract.submitTransaction(
          "SmartContract:" + fcn,
          args[0],
          args[1],
          args[2]
        );
        logger.info("Mint successful");
        result = "success";
        break;
      case "TransferFrom":
        result = await contract.submitTransaction(
          "SmartContract:" + fcn,
          args[0],
          args[1],
          args[2],
          args[3]
        );
        logger.info("Transfer successful");
        result = { txid: result.toString() };
        break;
        case "ClientAccountID":
          result = await contract.submitTransaction(
            "SmartContract:" + fcn
          );
        logger.info("ClientID retrieved.");
        result = { ClientID: result.toString() };
        break;
        case "ClientAccountBalance":
        result = await contract.submitTransaction(
          "SmartContract:" + fcn, 
          args[0]
        );
        logger.info("Client balance retrieved.");
        result = { ClientBalance: result.toString() };
        break;
        break;
      default:
        break;
    }

    await gateway.disconnect();

    // result = JSON.parse(result.toString());

    let response = {
      message: message,
      result,
    };

    return response;
  } catch (error) {
    logger.error(`Getting error: ${error}`);
    return error.message;
  }
};

exports.invokeTransaction = invokeTransaction;
