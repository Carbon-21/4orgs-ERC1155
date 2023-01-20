const logger = require("../util/logger");
const HttpError = require("../util/http-error");
const helper = require("../app/helper");

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

// General
exports.checkForStatus = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channel = req.params.channel;
  const username = req.jwt.username;
  const status = req.body.status;
  const org = req.jwt.org;

  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username, next);
  if (!chaincode) return;

  //get the NFT listed given status
  try {
    let result = await chaincode.submitTransaction("SmartContract:CheckForStatus", status);
    result = result.toString();

    //close communication channel
    await gateway.disconnect();

    //send OK response
    logger.info(`NFT list for status ${status}: ${result} `);
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