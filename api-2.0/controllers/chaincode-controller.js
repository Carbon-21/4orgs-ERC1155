const { Client, User } = require("fabric-common");
const invoke = require("../app/invoke");
const query = require("../app/query");
const helper = require("../app/helper");
const logger = require("../util/logger");

const transactionBuffer = [];

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
    args[0] = username
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

exports.teste = async function (req, res) {
  username = req.body.username;
  org_name = req.body.org_name;
  
  await helper.teste(username, org_name);

};

exports.getProposal = async function (req, res){
  let build_options = req.body.transaction;
  let username = req.body.username
  let proposalDigest = await helper.digestTransaction(build_options, username, "Carbon", "mychannel");
  res.send({digest: proposalDigest});
}

exports.signProposal = async function (req, res){
  let signatureString = req.body.signature;
  //let signature = helper.str2ab(signatureString);
  let signature = Buffer.from(signatureString, 'hex');
  console.log('signature arrayada',signature)
  await helper.signTransaction(signature);
  res.send({message:"sucess"});
}

// app.get(
//   "/qscc/channels/:channelName/chaincodes/:chaincodeName",
//   async function (req, res) {
//     try {
//       logger.debug(
//         "==================== QUERY BY CHAINCODE =================="
//       );

//       var channelName = req.params.channelName;
//       var chaincodeName = req.params.chaincodeName;
//       console.log(`chaincode name is :${chaincodeName}`);
//       let args = req.query.args;
//       let fcn = req.query.fcn;
//       // let peer = req.query.peer;

//       logger.debug("channelName : " + channelName);
//       logger.debug("chaincodeName : " + chaincodeName);
//       logger.debug("fcn : " + fcn);
//       logger.debug("args : " + args);

//       if (!chaincodeName) {
//         res.json(getErrorMessage("'chaincodeName'"));
//         return;
//       }
//       if (!channelName) {
//         res.json(getErrorMessage("'channelName'"));
//         return;
//       }
//       if (!fcn) {
//         res.json(getErrorMessage("'fcn'"));
//         return;
//       }
//       if (!args) {
//         res.json(getErrorMessage("'args'"));
//         return;
//       }
//       console.log("args==========", args);
//       args = args.replace(/'/g, '"');
//       args = JSON.parse(args);
//       logger.debug(args);

//       let response_payload = await qscc.qscc(
//         channelName,
//         chaincodeName,
//         args,
//         fcn,
//         req.username,
//         req.org
//       );

//       // const response_payload = {
//       //     result: message,
//       //     error: null,
//       //     errorData: null
//       // }

//       res.send(response_payload);
//     } catch (error) {
//       const response_payload = {
//         result: null,
//         error: error.name,
//         errorData: error.message,
//       };
//       res.send(response_payload);
//     }
//   }
// );
