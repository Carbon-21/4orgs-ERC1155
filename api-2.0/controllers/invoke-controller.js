const logger = require("../util/logger");
const HttpError = require("../util/http-error");
const helper = require("../app/helper");
const FabricClient = require('fabric-client')

var client = null;
var channel = null;
var transactionBuffer = [];

const setupClient = async () => {
  client = FabricClient.loadFromConfig('../network_org1.yaml');
  await client.initCredentialStores();
  channel = client.getChannel('mychannel');
}

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

exports.generateTransactionProposal = async (req, res, next) => {

  const clientCertificate = req.body.certificate;
  const transactionProposal = req.body.transaction;
  const org = "CarbonMSP" // Hardcoded
  await client.initCredentialStores();

  try {
    var { proposal, tx_id } = channel.generateUnsignedProposal(transactionProposal, org, clientCertificate);
    transactionBuffer = [];
    transactionBuffer.push({proposal: proposal});

    //Hash the transaction proposal
    var proposalBytes = proposal.toBuffer();
    logger.debug('typeof proposalBytes =', typeof proposalBytes)
    var digest = client.getCryptoSuite().hash(proposalBytes);
    logger.debug('Proposal Digest = ', digest)
    let proposalHex = Buffer.from(proposalBytes).toString('hex');
    logger.debug('proposal Hex =', proposalHex);
    logger.debug('proposal Bytes =', proposalBytes);
    return res.json({
      result: {result: "sucess", digest: digest, proposal: proposalHex}
    });
  } catch (err) {
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, err.message)); // switched errMessage[1] to err.message temporarily
  }
}
