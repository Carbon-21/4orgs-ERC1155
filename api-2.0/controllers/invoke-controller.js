const logger = require("../util/logger");
const HttpError = require("../util/http-error");
const helper = require("../app/helper");
const FabricClient = require('fabric-client')
var util = require('util');

var client = null;
var channel = null;
var transactionBuffer = [];

/**
 * Loads Client and Channel objects from network config file. These objects are necessary to 
 * send the transaction proposal to the network.
 */
const setupClient = async () => {
  client = FabricClient.loadFromConfig('../network_org1.yaml');
  await client.initCredentialStores();
  channel = client.getChannel('mychannel');
}

// client and channel objects are initialized together with the server.
setupClient();

//mint given token for a user
exports.mint = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const tokenId = req.body.tokenId;
  const tokenAmount = req.body.tokenAmount;
  const tokenReceiver = req.body.tokenReceiver;
  const username = req.jwt.username;
  const org = req.jwt.org;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //get receiver id
  const receiverAccountId = await helper.getAccountId(channel, chaincodeName, tokenReceiver, org, next);
  if (!receiverAccountId) return;

  //mint
  try {
    await chaincode.submitTransaction("SmartContract:Mint", receiverAccountId, tokenId, tokenAmount);
    logger.info("Mint successful");

    //close communication channel
    await gateway.disconnect();
  } catch (err) {
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, errMessage[1]));
  }
  
  //send OK response
  return res.json({
    result: "success",
  });
};

//transfer a given amount of a token from a user to another
exports.transfer = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const tokenId = req.body.tokenId;
  const tokenAmount = req.body.tokenAmount;
  const tokenReceiver = req.body.tokenReceiver;
  const tokenSender = req.body.tokenSender;
  const username = req.jwt.username;
  const org = req.jwt.org;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //get sender id
  const senderAccountId = await helper.getAccountId(channel, chaincodeName, tokenSender, org, next);
  if (!senderAccountId) return;

  //get receiver id
  const receiverAccountId = await helper.getAccountId(channel, chaincodeName, tokenReceiver, org, next);
  if (!receiverAccountId) return;

  //transfer
  try {
    await chaincode.submitTransaction("SmartContract:TransferFrom", senderAccountId, receiverAccountId, tokenId, tokenAmount);
    logger.info("Transference successful");

    //close communication channel
    await gateway.disconnect();

    //send OK response
    return res.json({
      result: "success",
    });
  } catch (err) {
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, errMessage[1]));
  }
};

//set a URI for a given token
exports.setURI = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const tokenId = req.body.tokenId;
  const URI = req.body.URI;
  const username = req.jwt.username;
  const org = req.jwt.org;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //set URI
  try {
    await chaincode.submitTransaction("SmartContract:SetURI", tokenId, URI);
    logger.info("URI set successfully");

    //close communication channel
    await gateway.disconnect();

    //send OK response
    return res.json({
      result: "success",
    });
  } catch (err) {
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, errMessage[1]));
  }
};

////////// OFFLINE TRANSACTION SIGNING METHODS //////////

/**
 * Generates the transaction proposal for the client. The 1st route
 * in the client-side transaction signing flux.
 * @param {*} req Contains the transaction dictionary to be transformed in the transaction proposal by the server and the client's certificate.
 * @param {*} res The transaction proposal's digest (which will bi signed by the client) and the proposal itself in hex.
 */
exports.generateTransactionProposal = async (req, res, next) => {

  const clientCertificate = req.body.certificate;
  const transactionProposal = req.body.transaction;
  const org = "CarbonMSP" // Hardcoded
  await client.initCredentialStores();

  try {
    var { proposal, tx_id } = channel.generateUnsignedProposal(transactionProposal, org, clientCertificate);
    transactionBuffer = [];
    transactionBuffer.push({proposal: proposal});

    var proposalBytes = proposal.toBuffer();
    logger.debug('typeof proposalBytes =', typeof proposalBytes)
    logger.debug('proposal Bytes =', proposalBytes);

    //Hash the transaction proposal
    var digest = client.getCryptoSuite().hash(proposalBytes);
    logger.debug('Proposal Digest = ', digest)

    let proposalHex = Buffer.from(proposalBytes).toString('hex');
    logger.debug('proposal Hex =', proposalHex);

    return res.json({
      result: {result: "sucess", digest: digest, proposal: proposalHex}
    });
  } catch (err) {
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, err.message)); // switched errMessage[1] to err.message temporarily
  }
}

/**
 * Receives the signed transaction proposal from the client and sends it to the network. The 2nd route
 * in the client-side transaction signing flux.
 * @param {*} req Contains the transaction proposal and its signature, which will be sent to the network.
 * @param {*} res The transaction in hex; the transaction digest; payload: the result of the transaction; the status of the transaction; the response message.
 */
exports.sendSignedTransactionProposal = async (req, res, next) => {
  try {
    let signatureHex = req.body.signature;
    let proposalHex = req.body.proposal;

    //Hex to bytes
    let signature = Uint8Array.from(Buffer.from(signatureHex, 'hex'));
    let proposalBytes = Buffer.from(proposalHex, 'hex');

    signedProposal = {
      signature,
      proposal_bytes: proposalBytes
    }
  
    var targets1 = client.getPeersForOrg('CarbonMSP');
    var targets2 = client.getPeersForOrg('UsersMSP');
    var targets3 = client.getPeersForOrg('IbamaMSP');
    var targets4 = client.getPeersForOrg('CetesbMSP');

    // console.log('########targets1',targets1)
    // console.log('########targets2',targets1)
    // console.log('########targets3',targets1)
    // console.log('########targets4',targets1)
  
    var proposal_request = {
      signedProposal: signedProposal,
      // Ele está enviando para todos, porém ao receber a primeira resposta já encaminha para o orderer.
      // Soluções possíveis: mudar a politica de endosso pra Any ou fazer ele agrupar mais endossos antes de enviar.
      // Fui pelo mais fácil e mudei a política de endosso para Any, e funcionou. 
      targets: targets1, targets2, targets3, targets4
    }
  
    let proposalResponses = await channel.sendSignedProposal(proposal_request);
    logger.debug('Send Proposal Response:', proposalResponses[0]);

    if (proposalResponses[0] instanceof Error)
      return res.json({result: "failure"});
    
    let payload = proposalResponses[0].response.payload.toString();
    let status = proposalResponses[0].response.status;
    let message = proposalResponses[0].response.message;

    logger.debug('Payload =', payload);
  
    // 5. Generate unsigned transaction
    transaction_request = {
      proposalResponses: proposalResponses,
      //proposal: proposalBytes,
      proposal: transactionBuffer[0].proposal
    };

    transactionBuffer[0].transaction_request = transaction_request;
    var commitProposal = await channel.generateUnsignedTransaction(transaction_request);
    //logger.debug("commitProposal = ", commitProposal)
    let transactionBytes = commitProposal.toBuffer();

    let transactionHex = Buffer.from(transactionBytes).toString('hex');
    logger.debug("transactionHex = ", transactionHex);

    var transactionDigest = client.getCryptoSuite().hash(transactionBytes);
    logger.debug("transactionDigest =", transactionDigest);


    return res.json({
      result: {result: "success", transaction: transactionHex, transactionDigest: transactionDigest, payload: payload, status: status, message: message}
    });
  } catch (err) {
    console.log(err);
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, err.message)); // switched errMessage[1] to err.message temporarily
  }
}


/**
 * Receives the signed transaction from the client and commits it to the network. The 3rd and last route
 * in the client-side transaction signing flux.
 * @param {*} req Contains the transaction and its signature, which will be sent to the network.
 * @param {*} res The commit response status and message.
 */
exports.commitSignedTransaction = async (req, res, next) => {
  try {
    let signatureHex = req.body.signature;
    let transactionHex = req.body.transaction;
    
    //Hex to bytes
    let signature = Uint8Array.from(Buffer.from(signatureHex, 'hex'));

    let transactionBytes = Buffer.from(transactionHex, 'hex');

    var signedTransactionProposal = {
      signature: signature,
      proposal_bytes: transactionBytes,
    };

    let transaction_request = transactionBuffer.pop().transaction_request;

    var signedTransaction = {
      signedProposal: signedTransactionProposal,
      request: transaction_request,
    }

    console.log('Transaction request sent to the orderer:');
    console.log(util.inspect(signedTransaction));

    // 7. Commit the signed transaction
    let commitTransactionResponse = await channel.sendSignedTransaction(signedTransaction);
    console.log('Successfully sent transaction');
    console.log('Return code: '+commitTransactionResponse.status);
    console.log('Response message:', commitTransactionResponse)
    return res.json({result: commitTransactionResponse.status, message: commitTransactionResponse.info});

  } catch (err) {
    console.log(err);
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, err.message)); // switched errMessage[1] to err.message temporarily));
  }
}
