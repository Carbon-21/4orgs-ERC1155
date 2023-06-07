const logger = require("../util/logger");
const HttpError = require("../util/http-error");
const helper = require("../app/helper");
const FabricClient = require("fabric-client");
var util = require("util");
var crypto = require("crypto");

// Global objects that are used to establish connection to the Fabric network in the client-side signing mode
var client = null;
var channel = null;
// Stores info of a transaction that has been initiated (for client-side mode)
var transactionBuffer = [];

/**
 * Loads Client and Channel objects from network config file. These objects are necessary to
 * send the transaction proposal to the network.
 */
const setupClient = async () => {
  // Loads network config from file
  client = FabricClient.loadFromConfig("../network_org1.yaml");
  await client.initCredentialStores();
  channel = client.getChannel("mychannel");
};

// client and channel objects are initialized together with the server.
setupClient();

//mint given token for a user
exports.mint = async (req, res, next) => {
  logger.info("Entered mint function");

  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  let tokenId = req.body.tokenId;
  const tokenAmount = req.body.tokenAmount;
  const tokenReceiver = req.body.tokenReceiver;
  const metadata = req.body.metadata !== undefined ? req.body.metadata : {};
  const username = req.jwt.username;
  const org = req.jwt.org;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //get receiver id
  const receiverAccountId = await helper.getAccountId(channel, chaincodeName, tokenReceiver, org, next);
  if (!receiverAccountId) return;

  //if NFT => generate ID by hashing NFT info
  if (tokenId !== "$ylvas") {
    tokenId = generateTokenId(req.body);
    req.body.tokenId = tokenId;
  }

  //mint.
  try {
    await chaincode.submitTransaction("SmartContract:Mint", receiverAccountId, tokenId, tokenAmount, JSON.stringify(metadata));

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

exports.compensateNFT = async (req, res, next) => {
  logger.info("Entered compensation function");

  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const tokenId = req.body.tokenId;
  const username = req.jwt.username;
  const org = req.jwt.org;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //get receiver id
  const receiverAccountId = await helper.getAccountId(channel, chaincodeName, username, org, next);
  if (!receiverAccountId) return;

  try {
    await chaincode.submitTransaction("SmartContract:CompensateNFT", receiverAccountId, tokenId);

    logger.info("Compensation successful");

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

//set a URI for an IPFS input
exports.setURILocal = async (hash, org, chaincodeName, channelName) => {
  //get get date in dd-mm-yyyy format
  let currentDate = new Date();
  currentDate = currentDate.getDate() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getFullYear();

  //set URL to ipfs format
  const uri = "ipfs://" + hash;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channelName, chaincodeName, "admin", null);

  //set URI
  try {
    await chaincode.submitTransaction("SmartContract:SetURI", String(currentDate), uri);

    logger.info("URI set successfully");

    //close communication channel
    await gateway.disconnect();

    //send OK response
    return uri;
  } catch (err) {
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return new HttpError(500, errMessage[1]);
  }
};

//List a NFT for sale
exports.listForSale = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const tokenId = req.body.tokenId;
  const price = req.body.price;
  const username = req.jwt.username;
  const org = req.jwt.org;

    //get owner id
    const ownerAccountId = await helper.getAccountId(channel, chaincodeName, username, org, next);
    if (!ownerAccountId) return;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //listForSale
  try {
    await chaincode.submitTransaction("SmartContract:ListForSale", ownerAccountId, tokenId, price);
    logger.info("listForSale set successfully");
 
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


//Buy a listed NFT
exports.buyListed = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const tokenId = req.body.tokenId;
  const username = req.jwt.username;
  const org = req.jwt.org;

    //get buyer id
    const buyerAccountId = await helper.getAccountId(channel, chaincodeName, username, org, next);
    if (!buyerAccountId) return;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //Buy listed
  try {
    await chaincode.submitTransaction("SmartContract:Buy", buyerAccountId, tokenId);
    logger.info("listForSale set successfully");
 
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
 * Para melhor entender as rotas abaixo, sugiro ler primeiramente o método offlineTransaction no script transaction-handler.js. Esse método é a
 * "main" que executa todo o procedimento de geração da proposta de transação, assinatura e envio às rotas abaixo.
 */

/**
 * Generates the transaction proposal for the client. The 1st route
 * in the client-side transaction signing flux.
 * @param {*} req Contains the transaction dictionary to be transformed in the transaction proposal by the server and the client's certificate.
 * @param {*} res The transaction proposal's digest (which will bi signed by the client) and the proposal itself in hex.
 */
exports.generateTransactionProposal = async (req, res, next) => {
  // Client's certificate emitted by Fabric's CA
  const clientCertificate = req.body.certificate;

  // The transaction proposal that was chosen by the client on the website
  const transactionProposal = req.body.transaction;
  const org = "CarbonMSP"; // Hardcoded
  await client.initCredentialStores();

  try {
    // Generates unsidneg transaction proposal, which will be returned to the client for signing
    var { proposal, tx_id } = channel.generateUnsignedProposal(transactionProposal, org, clientCertificate);

    // Stores transaction proposal in buffer to be fetched again at commitSignedTransaction route.
    transactionBuffer = [];
    transactionBuffer.push({ proposal: proposal });

    // To Bytes
    var proposalBytes = proposal.toBuffer();
    logger.debug("proposal Bytes =", proposalBytes);

    // Hash the transaction proposal
    var digest = client.getCryptoSuite().hash(proposalBytes);
    logger.debug("Proposal Digest = ", digest);

    // Transaction proposal in hex
    let proposalHex = Buffer.from(proposalBytes).toString("hex");
    logger.debug("proposal Hex =", proposalHex);

    return res.json({
      result: { result: "sucess", digest: digest, proposal: proposalHex },
    });
  } catch (err) {
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, err.message));
  }
};

/**
 * Receives the signed transaction proposal from the client and sends it to the network. The 2nd route
 * in the client-side transaction signing flux.
 * @param {*} req Contains the transaction proposal and its signature, which will be sent to the network.
 * @param {*} res The transaction in hex; the transaction digest; payload: the result of the transaction; the status of the transaction; the response message.
 */
exports.sendSignedTransactionProposal = async (req, res, next) => {
  try {
    // Transaction Proposal's Signature in Hex
    let signatureHex = req.body.signature;

    // Transaction Proposal in Hex
    let proposalHex = req.body.proposal;

    // Converting Hex to Bytes
    let signature = Uint8Array.from(Buffer.from(signatureHex, "hex"));
    let proposalBytes = Buffer.from(proposalHex, "hex");

    // Signed Proposal
    signedProposal = {
      signature,
      proposal_bytes: proposalBytes,
    };

    // Get the networks's Peers for each Org
    var targets1 = client.getPeersForOrg("CarbonMSP");
    var targets2 = client.getPeersForOrg("UsersMSP");
    var targets3 = client.getPeersForOrg("IbamaMSP");
    var targets4 = client.getPeersForOrg("CetesbMSP");

    // Request to send transaction proposal to the peers
    var proposal_request = {
      signedProposal: signedProposal,
      // Ele está enviando para todos, porém ao receber a primeira resposta já encaminha para o orderer.
      // Soluções possíveis: mudar a politica de endosso pra Any ou fazer ele agrupar mais endossos antes de enviar.
      // Fui pelo mais fácil e mudei a política de endosso para Any, e funcionou.
      targets: targets1,
      targets2,
      targets3,
      targets4,
    };

    // Sends Signed Proposal to the Peers
    let proposalResponses = await channel.sendSignedProposal(proposal_request);
    logger.debug("Send Proposal Response:", proposalResponses[0]);

    if (proposalResponses[0] instanceof Error) return res.json({ result: "failure" });

    // The result of the execution of the transaction proposal by the peers
    let payload = proposalResponses[0].response.payload.toString();
    let status = proposalResponses[0].response.status;
    let message = proposalResponses[0].response.message;

    logger.debug("Payload =", payload);

    // 5. Generate unsigned transaction
    transaction_request = {
      proposalResponses: proposalResponses,
      //proposal: proposalBytes,
      proposal: transactionBuffer[0].proposal,
    };

    transactionBuffer[0].transaction_request = transaction_request;
    var commitProposal = await channel.generateUnsignedTransaction(transaction_request);
    //logger.debug("commitProposal = ", commitProposal)
    let transactionBytes = commitProposal.toBuffer();

    let transactionHex = Buffer.from(transactionBytes).toString("hex");
    logger.debug("transactionHex = ", transactionHex);

    var transactionDigest = client.getCryptoSuite().hash(transactionBytes);
    logger.debug("transactionDigest =", transactionDigest);

    return res.json({
      result: { result: "success", transaction: transactionHex, transactionDigest: transactionDigest, payload: payload, status: status, message: message },
    });
  } catch (err) {
    logger.debug(err);
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, err.message)); // switched errMessage[1] to err.message temporarily
  }
};

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
    let signature = Uint8Array.from(Buffer.from(signatureHex, "hex"));

    let transactionBytes = Buffer.from(transactionHex, "hex");

    var signedTransactionProposal = {
      signature: signature,
      proposal_bytes: transactionBytes,
    };

    let transaction_request = transactionBuffer.pop().transaction_request;

    var signedTransaction = {
      signedProposal: signedTransactionProposal,
      request: transaction_request,
    };

    logger.info("Transaction request sent to the orderer.");
    logger.debug(util.inspect(signedTransaction));

    // 7. Commit the signed transaction
    let commitTransactionResponse = await channel.sendSignedTransaction(signedTransaction);
    logger.info("Successfully sent transaction");
    console.info("Return code: " + commitTransactionResponse.status);
    console.info("Response message:", commitTransactionResponse);
    return res.json({ result: commitTransactionResponse.status, message: commitTransactionResponse.info });
  } catch (err) {
    logger.debug(err);
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, err.message)); // switched errMessage[1] to err.message temporarily));
  }
};

//mint given token for a user
exports.ftfromnft = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const username = req.jwt.username;
  const org = req.jwt.org;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //mint
  try {
    let result = await chaincode.submitTransaction("SmartContract:FTFromNFT");
    logger.info(`FT Minted From NFT ${result}`);

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

//sha-256 from token info + timestamp
const generateTokenId = (tokenInfoJson) => {
  //add more entropy
  tokenInfoJson["timestamp"] = Date.now();

  //hash all the info
  const tokenInfo = JSON.stringify(tokenInfoJson);
  const hash = crypto.createHash("sha256").update(tokenInfo).digest("hex");

  return hash;
};
