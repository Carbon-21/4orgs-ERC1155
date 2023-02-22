const logger = require("../util/logger");
const HttpError = require("../util/http-error");
const helper = require("../app/helper");
var { BlockDecoder } = require("fabric-common");
const { json } = require("body-parser");

//get user's balance of a given token
exports.balance = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const tokenId = req.query.tokenId;
  const tokenOwner = req.query.tokenOwner;
  const username = req.jwt.username;
  const org = req.jwt.org;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //get owner id
  const ownerAccountId = await helper.getAccountId(channel, chaincodeName, tokenOwner, org, next);
  if (!ownerAccountId) return;

  //get balance
  try {
    let result = await chaincode.evaluateTransaction("SmartContract:BalanceOf", ownerAccountId, tokenId);
    result = JSON.parse(result.toString());

    //close communication channel
    await gateway.disconnect();

    //send OK response
    logger.info(`${tokenId} balance retrieved successfully: ${result} `);
    return res.json({
      result,
    });
  } catch (err) {
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, errMessage[1]));
  }
};

//return the balance of the requesting client's account, for a given token
exports.selfBalance = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const tokenId = req.query.tokenId;
  const username = req.jwt.username;
  const org = req.jwt.org;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //get balance
  try {
    let result = await chaincode.evaluateTransaction("SmartContract:SelfBalance", tokenId);
    result = JSON.parse(result.toString());

    //close communication channel
    await gateway.disconnect();

    //send OK response
    logger.info(`${tokenId} balance retrieved successfully: ${result} `);
    return res.json({
      result,
    });
  } catch (err) {
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, errMessage[1]));
  }
};

//return the nfts of the own client's account ---- Ver
exports.selfBalanceNFT = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const username = req.jwt.username;
  const org = req.jwt.org;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //get balance
  try {
    let result = await chaincode.evaluateTransaction("SmartContract:SelfBalanceNFT");
    console.log("Result", result);
    result = JSON.parse(result.toString());

    //close communication channel
    await gateway.disconnect();

    //send OK response
    //logger.info(`${tokenId} balance retrieved successfully: ${result} `);
    return res.json({
      result,
    });
  } catch (err) {
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    console.log(err.message);
    //return next(new HttpError(500, errMessage[1]));
    return next(new HttpError(500, err.message));
  }
};

//return the nfts of the requesting client's account ---- Ver
exports.balanceNFT = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const tokenOwner = req.query.tokenOwner;
  const username = req.jwt.username;
  const org = req.jwt.org;

  logger.info(`${tokenOwner} Owner `);
  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //get owner id
  const ownerAccountId = await helper.getAccountId(channel, chaincodeName, tokenOwner, org, next);
  if (!ownerAccountId) return;

  //get balance
  try {
    let result = await chaincode.evaluateTransaction("SmartContract:balanceNFT", ownerAccountId);
    result = JSON.parse(result.toString());

    //close communication channel
    await gateway.disconnect();

    //send OK response
    //logger.info(`${tokenId} balance retrieved successfully: ${result} `);
    return res.json({
      result,
    });
  } catch (err) {
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    console.log("aqqui", err.message);
    return next(new HttpError(500, err.message));
    //return next(new HttpError(500, errMessage[1]));
  }
};

//get total supply of a given token
exports.totalSupply = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const tokenId = req.query.tokenId;
  const username = req.jwt.username;
  const org = req.jwt.org;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //get total supply
  try {
    let result = await chaincode.evaluateTransaction("SmartContract:TotalSupply", tokenId);
    result = JSON.parse(result.toString());

    //close communication channel
    await gateway.disconnect();

    //send OK response
    logger.info(`${tokenId} total supply successfully: ${result} `);
    return res.json({
      result,
    });
  } catch (err) {
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, errMessage[1]));
  }
};

//get the URI for a given token
exports.getURI = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const tokenId = req.query.tokenId;
  const username = req.jwt.username;
  const org = req.jwt.org;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //get URI
  try {
    let result = await chaincode.submitTransaction("SmartContract:GetURI", tokenId);
    result = result.toString();

    //close communication channel
    await gateway.disconnect();

    //send OK response
    logger.info(`${tokenId} URI retrieved successfully: ${result} `);
    return res.json({
      result,
    });
  } catch (err) {
    console.log(err);
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, errMessage[1]));
  }
};

//get entire world state
exports.getWorldState = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode("Carbon", channel, chaincodeName, "admin", next);
  if (!chaincode) return;

  //get balance
  try {
    let result = await chaincode.evaluateTransaction("SmartContract:GetWorldState");

    result = Buffer.from(result).toString();

    //close communication channel
    await gateway.disconnect();

    //send OK response
    logger.info(`World state fetched!`);
    return res.json({
      result,
    });
  } catch (err) {
    return next(new HttpError(500, err));
  }
};

//get last block
exports.getBlockchainTail = async (req, res, next) => {
  let chaincodeName = req.params.chaincode;
  const channelName = req.params.channel;

  // //connect to the channel and get the
  // const [chaincode, gateway] = await helper.getChaincode("Carbon", channelName, chaincodeName, "admin", next);
  // if (!chaincode) return;

  // console.log(chaincode);

  const [channel, gateway] = await helper.getChannel("Carbon", channelName, "admin", next);
  if (!channel) return;

  // const [channel, gateway] = await helper.getChannel("Carbon", "mychannel", "admin", next);
  // if (!channel) return;

  // const FabricClient = require("fabric-client");

  // client = FabricClient.loadFromConfig("../network_org1.yaml");
  // await client.initCredentialStores();
  // channelObj = client.getChannel("mychannel");

  try {
    r = await channel.queryBlock(1);
    console.log(r);

    //use QSCC
    // const network = await gateway.getNetwork(channel);
    // const contract = network.getContract("qscc");

    // let info = await contract.evaluateTransaction("GetChainInfo", channel);
    // // console.log(BlockDecoder.decodeTransaction(info));
    // // a = JSON.parse(JSON.stringify(info).toString()).data;
    // // console.log(a);
    // // console.log(Buffer.from(a).toString("hex"));
    // // json.Unmarshall(info);

    // // console.log(Buffer.from(JSON.parse(JSON.stringify(info).data.toString())));
    // // const bytesString = String.fromCharCode(...info);
    // // console.log(JSON.Unmarshal(info));
    // // console.log(Buffer.from(info).toString());
    // // console.log(bytesString);

    // //get blockhain's tail
    // // let result = await contract.evaluateTransaction("GetBlockByNumber", channel, 12);

    // let result = await contract.evaluateTransaction("GetBlockByNumber", channel, 12);

    // //decode result
    // // console.log(Buffer.from(result).toString());

    // result = BlockDecoder.decode(result);
    // console.log(BlockDecoder.decodeBlock(result));
    // console.log(Buffer.from(result.header.data_hash).toString());

    //close communication channel
    await gateway.disconnect();

    return res.json({
      r,
    });
  } catch (err) {
    return next(new HttpError(500, err));
  }
};
