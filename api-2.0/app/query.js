const { Query, User, Client} = require("fabric-common");
const { Gateway, Wallets } = require("fabric-network");
const logger = require("../util/logger");

const helper = require("./helper");

const FabricCAServices = require("fabric-ca-client");

const query = async (channelName, chaincodeName, args, fcn, username, org_name) => {
  try {
    // load the network configuration
    const ccp = await helper.getCCP(org_name);

    // Create a new file system based wallet for managing identities.
    const walletPath = await helper.getWalletPath(org_name);
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
      identity: 'admin',
      discovery: { enabled: true, asLocalhost: true },
    });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork(channelName);
    let identityNetwork = await gateway.getIdentity();
    console.log('### identityNetwork ###\n',identityNetwork)
    // await identityNetwork.serialize()
    // console.log('### PASSOU!!! ###')

    // ### TESTE ASSINATURA ###
    // User, Client, idx, channel, query, commit, endorsement,
    //try{
      // let config = new Object();
      // config.enrollmentId = 'admin';
      // //config.affiliation = 'carbon.department1';
      // console.log('flag1')
      // let userTeste = new User(config);
      // //console.log('###################IDN private key= ######################',identityNetwork.privateKey)
      // await userTeste.setEnrollment(
      //   identityNetwork.credentials.privateKey,
      //   identityNetwork.credentials.certificate,
      //   identityNetwork.mspId
      // );
      // //let identityFromCA = await helper.getRegisteredUserFromCA(username, org_name);
      // //userTeste._identity = identityFromCA;
      // console.log('### userTeste ###',userTeste)
      // console.log('flag2')
      // let clientTeste = new Client(username);
      // //console.log('### clienTeste ###\n',clientTeste)
      // let idx = clientTeste.newIdentityContext(userTeste);
      // let channel = network.getChannel();
      // console.log('####### channel ####### = \n',channel)
      // let query = channel.newQuery('erc1155');
      // //console.log('query é igual a\n',query)
      // let build_options = {fcn: 'ClientAccountBalance', args: ['$ylvas']};
      // let proposalBytes = query.build(idx, build_options);
      // console.log('### proposal bytes: ###\n' + typeof proposalBytes,proposalBytes);
      
      // let hash = crypto.createHash("sha256").update(proposalBytes).digest("hex")
      // console.log('### proposalBytes hash ### =',hash);
      //console.log('### channel ###\n',channel);
      //console.log('### endorsement ###\n',endorsement);

    // } catch(e){
    //   console.log('### Erro query ### : ', e.message);
    // }

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
      case "TotalSupply":
        result = await contract.evaluateTransaction("SmartContract:" + fcn, args[0]);
        break;
      case "ClientAccountID":
        result = await contract.evaluateTransaction("SmartContract:" + fcn);
        result = `{"ClientID":"${result.toString()}"}`;
        break;
      case "ClientAccountBalance":
        result = await contract.evaluateTransaction("SmartContract:" + fcn, args[0]);
        result = `{"ClientAccountBalance":"${result.toString()}"}`;
        console.log('resulttt',result)
        break;

      /*
      ClientAccountTotalBalance: Gets the total balance of all the client's NFTs, without the need to provide its ids 
      (the original CLientAccountBalance gets only one balance per id). This new case route calls ClientAccountBalance 
      iteratively for every id of the user's NFTs.
      */
      case "ClientAccountTotalBalance":
        let clientNfts = await helper.queryAttribute(username, org_name, 'nfts');
        if (clientNfts == null) {
          result = JSON.stringify({message: "NO_TOKENS"});
        } else {
          clientNfts = await JSON.parse(clientNfts)
          let balances = {};
          let nftValue
          for (var i = 0; i < clientNfts.length; i++) {
            console.log(clientNfts[i])
            nftValue = await contract.evaluateTransaction("SmartContract:ClientAccountBalance", clientNfts[i]);
            nftValue = nftValue.toString()
            balances[clientNfts[i]] = nftValue;
          }
          result = JSON.stringify({message: "success", balances: balances})
        }
        break;

      case "URI":
        result = await contract.evaluateTransaction("SmartContract:" + fcn, args[0]);
        result = `{"URI":"${result.toString()}"}`;
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