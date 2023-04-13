const logger = require("../util/logger");
const HttpError = require("../util/http-error");
const helper = require("../app/helper");
const { BlockDecoder } = require("fabric-common");
const fabproto6 = require("fabric-protos");

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

//TODO remover quando os metadados forem pro chaincode. Remover tb setURI e metadata-controller
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
    let result = await chaincode.evaluateTransaction("SmartContract:GetURI", tokenId);
    result = result.toString();

    //close communication channel
    await gateway.disconnect();

    //send OK response
    logger.info(`${tokenId} URI retrieved successfully: ${result} `);
    return res.json({
      result,
    });
  } catch (err) {
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, errMessage[1]));
  }
};

//get block IPFS URI, given a date
exports.getURILocal = async (currentDate, org, chaincodeName, channelName) => {
  //connect to the channel and get the chaincode
  const [chaincode, gateway] = await helper.getChaincode(org, channelName, chaincodeName, "admin", null);

  //set URI
  try {
    let uri = await chaincode.evaluateTransaction("SmartContract:GetURI", currentDate);
    uri = Buffer.from(uri).toString();

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
      result: JSON.parse(result),
    });
  } catch (err) {
    return next(new HttpError(500, err));
  }
};

//get last block
exports.getBlockchainTail = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channelName = req.params.channel;

  // //connect to the channel and get the
  const [chaincode, gateway] = await helper.getChaincode("Carbon", channelName, chaincodeName, "admin", next);

  try {
    //use QSCC
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract("qscc");

    //get last block's number
    let info = await contract.evaluateTransaction("GetChainInfo", channelName);
    info = fabproto6.common.BlockchainInfo.decode(info);
    let tailNumber = info.height.low - 1;

    //get blockhain's tail
    let tail = await contract.evaluateTransaction("GetBlockByNumber", channelName, String(tailNumber));

    //decode block
    tail = BlockDecoder.decode(tail);

    //decode block's fields
    decodeBlockBuffers(tail);

    //close communication channel
    await gateway.disconnect();

    //send OK response
    logger.info(`Tail fetched!`);
    return res.json({
      tail,
      info,
    });
  } catch (err) {
    return next(new HttpError(500, err));
  }
};

//used on transparency log's crontab
exports.getBlockchainTailLocal = async (chaincodeName, channelName) => {
  // //connect to the channel and get the
  const [chaincode, gateway] = await helper.getChaincode("Carbon", channelName, chaincodeName, "admin", null);

  try {
    //use QSCC
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract("qscc");

    //get last block's number
    let info = await contract.evaluateTransaction("GetChainInfo", channelName);
    info = fabproto6.common.BlockchainInfo.decode(info);
    let tailNumber = info.height.low - 1;

    //get blockhain's tail
    let tail = await contract.evaluateTransaction("GetBlockByNumber", channelName, String(tailNumber));
    tail = BlockDecoder.decode(tail);
    decodeBlockBuffers(tail); //additional decoding

    //close communication channel
    await gateway.disconnect();

    tail.info = info;

    //send OK response
    logger.info(`Tail fetched!`);
    return tail;
  } catch (err) {
    return new HttpError(500, err);
  }
};

//get last block
exports.getRangeOfBlocks = async (req, res, next) => {
  const chaincodeName = req.params.chaincode;
  const channelName = req.params.channel;
  let min = req.query.min;
  let max = req.query.max;

  // //connect to the channel and get the
  const [chaincode, gateway] = await helper.getChaincode("Carbon", channelName, chaincodeName, "admin", next);

  try {
    //use QSCC
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract("qscc");

    //get tail's number
    let info = await contract.evaluateTransaction("GetChainInfo", channelName);
    info = fabproto6.common.BlockchainInfo.decode(info);
    const tailNumber = info.height.low - 1;

    //adjust initial block's number, if needed
    if (min === "início") min = 0;

    //get tail's number, if user requested it
    if (max === "fim") max = tailNumber;

    //if requested range is out of boundaries or isn't int => error
    min = parseInt(min);
    max = parseInt(max);
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max > tailNumber) return next(new HttpError(500, "Valor inválido."));

    //put every requested block in the blocks array
    let blocks = [];
    for (let i = min; i <= max; i++) {
      //get block
      let block = await contract.evaluateTransaction("GetBlockByNumber", channelName, String(i));

      //decode block
      block = BlockDecoder.decode(block);

      //append
      blocks.push(block);
    }

    //close communication channel
    await gateway.disconnect();

    //send OK response
    return res.json({
      blocks,
    });
  } catch (err) {
    return next(new HttpError(500, err));
  }
};

//encoded block info can be decoded to utf-8 or base64
decodeBlockBuffers = (block) => {
  block.header.previous_hash = Buffer.from(block.header.previous_hash).toString("base64");
  block.header.data_hash = Buffer.from(block.header.data_hash).toString("base64");

  block.data.data.forEach((item) => {
    item.signature = Buffer.from(item.signature).toString("base64");
    item.payload.header.channel_header.extension = Buffer.from(item.payload.header.channel_header.extension).toString();
    item.payload.header.signature_header.creator.id_bytes = Buffer.from(item.payload.header.signature_header.creator.id_bytes).toString();
    item.payload.header.signature_header.nonce = Buffer.from(item.payload.header.signature_header.nonce).toString("base64");

    item.payload.data.actions.forEach((i) => {
      i.header.creator.id_bytes = Buffer.from(i.header.creator.id_bytes).toString();
      i.header.nonce = Buffer.from(i.header.nonce).toString("base64");
      i.payload.action.proposal_response_payload.proposal_hash = Buffer.from(i.payload.action.proposal_response_payload.proposal_hash).toString("base64");
      i.payload.action.proposal_response_payload.extension.response.payload = Buffer.from(i.payload.action.proposal_response_payload.extension.response.payload).toString();

      i.payload.action.endorsements.forEach((j) => {
        j.signature = Buffer.from(j.signature).toString("base64");
        j.endorser.id_bytes = Buffer.from(j.endorser.id_bytes).toString();
      });
    });
  });

  block.metadata.metadata.forEach((item) => {
    if (item.value) {
      item.value = Buffer.from(item.value).toString("base64");
    }

    if (item.signatures)
      item.signatures.forEach((sig) => {
        sig.signature_header.creator.id_bytes = Buffer.from(sig.signature_header.creator.id_bytes).toString();
        sig.signature_header.nonce = Buffer.from(sig.signature_header.nonce).toString("base64");
        sig.signature = Buffer.from(sig.signature).toString("base64");
      });
  });

  // console.log(Object.keys(block.data.data[0].payload.header));
};
