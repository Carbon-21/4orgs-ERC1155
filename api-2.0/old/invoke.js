const { Gateway, Wallets } = require("fabric-network");

const logger = require("../util/logger");
const helper = require("./helper");
const { blockListener, contractListener } = require("./Listeners");

const invokeTransaction = async (channelName, chaincodeName, fcn, args, username, org_name, transientData) => {
  try {
    const ccp = await helper.getCCP(org_name);

    const walletPath = await helper.getWalletPath(org_name);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    //TODO após estudar wallets, temos que olhar se isso aqui será mantido
    let identity = await wallet.get(username);
    if (!identity) {
      console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
      await helper.getRegisteredUser(username, org_name, true);
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

    //TODO o pavan deixou um TODO escondido aqui kkk
    // Important: Please dont set listener here, I just showed how to set it. If we are doing here, it will set on every invoke call.
    // Instead create separate function and call it once server started, it will keep listening.
    await contract.addContractListener(contractListener);
    await network.addBlockListener(blockListener);

    // Multiple smartcontract in one chaincode
    let result;
    let message;

    switch (fcn) {
      case "Mint":
        const destinyClientAccountId = await helper.getAccountId(channelName, chaincodeName, args[0], org_name);
        result = await contract.submitTransaction("SmartContract:" + fcn, destinyClientAccountId, args[1], args[2]);
        logger.info("Mint successful");
        result = "success";

        if (args[1] != "$ylvas") {
          let nfts = await helper.queryAttribute(username, org_name, "nfts");

          if (nfts == null) nfts = [];
          else nfts = JSON.parse(nfts);

          // Add nft id to the user's nft list in the CA's database if it's not already included
          if (!nfts.includes(args[1])) {
            nfts.push(args[1]);
            helper.updateAttribute(username, org_name, "nfts", JSON.stringify(nfts));
          }
        }
        break;
      case "TransferFrom":
        const sourceClientAccountId = await helper.getAccountId(channelName, chaincodeName, args[0], org_name);
        const destClientAccountId = await helper.getAccountId(channelName, chaincodeName, args[1], org_name);
        result = await contract.submitTransaction("SmartContract:" + fcn, sourceClientAccountId, destClientAccountId, args[2], args[3]);
        logger.info("Transfer successful");
        result = { txid: result.toString() };
        break;
      case "SetURI":
        result = await contract.submitTransaction("SmartContract:" + fcn, args[1], args[2]);
        logger.info("SetURI successful");
        logger.info(result);
        result = { oi: "oi" };
        // result = { SetURI: result.toString() };
        break;
      //TODO: GetURI deveria ser uma função QUERY, porém só está funcionando como INVOKE. Verificar...
      case "GetURI":
        result = await contract.submitTransaction("SmartContract:" + fcn, args[1]);
        logger.info("GetURI successful");
        result = { GetURI: result.toString() };
        break;
      case "MintNFT":
        const destNFTClientAccountId = await helper.getAccountId(channelName, chaincodeName, args[0], org_name);
        result = await contract.submitTransaction("SmartContract:" + fcn, destNFTClientAccountId, args[1], args[2], args[3]);
        logger.info("Mint meta successful");
        result = { MintNFT: result.toString() };
        break;
      case "SetFileSrvCFG":
        result = await contract.submitTransaction("SmartContract:" + fcn, args[0], args[1]);
        logger.info("SetFileSrvCFG successful");
        result = { SetFileSrvCFG: result.toString() };
        break;
      default:
        break;
    }

    await gateway.disconnect();

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
