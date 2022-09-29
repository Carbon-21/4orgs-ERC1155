const invoke = require("../app/invoke");
const query = require("../app/query");
const logger = require("../util/logger");

exports.invoke = async (req, res, next) => {
  try {
    logger.debug("==================== INVOKE ON CHAINCODE ==================");

    const chaincodeName = req.params.chaincodeName;
    const channelName = req.params.channelName;
    const fcn = req.body.fcn;
    const args = req.body.args;
    const peers = req.body.peers;
    const transient = req.body.transient;
    const username = req.jwt.username;
    args[0] = username;
    const org = req.jwt.org;

    logger.debug(`transient data ;${transient}`);
    logger.debug("channelName  : " + channelName);
    logger.debug("chaincodeName : " + chaincodeName);
    logger.debug("fcn  : " + fcn);
    logger.debug("args  : " + args);
    logger.debug("peers  : " + peers);
    logger.debug("username  : " + username);

    let message = await invoke.invokeTransaction(
      channelName,
      chaincodeName,
      fcn,
      args,
      username,
      org,
      transient
    );
    logger.info(`Message result is : ${JSON.stringify(message)}`);

    const response_payload = {
      result: message,
      error: null,
      errorData: null,
    };
    res.send(response_payload);
  } catch (error) {
    const response_payload = {
      result: null,
      error: error.name,
      errorData: error.message,
    };
    res.send(response_payload);
  }
};

exports.query = async (req, res, next) => {
  try {
    logger.debug("==================== QUERY BY CHAINCODE ==================");

    const channelName = req.params.channelName;
    const chaincodeName = req.params.chaincodeName;
    let args = req.query.args;
    const fcn = req.query.fcn;
    const peer = req.query.peer;
    const username = req.jwt.username;
    const org = req.jwt.org;

    logger.debug("channelName : " + channelName);
    logger.debug("chaincodeName : " + chaincodeName);
    logger.debug("org : " + org);
    logger.debug("fcn : " + fcn);
    logger.debug("args : " + args);

    args = args.replace(/'/g, '"');
    args = JSON.parse(args);

    let message = await query.query(channelName, chaincodeName, args, fcn, username, org);

    const response_payload = {
      result: message,
      error: null,
      errorData: null,
    };

    res.send(response_payload);
  } catch (error) {
    const response_payload = {
      result: null,
      error: error.name,
      errorData: error.message,
    };
    res.send(response_payload);
  }
};
