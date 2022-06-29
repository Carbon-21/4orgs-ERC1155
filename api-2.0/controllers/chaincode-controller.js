// const express = require("express");
// const expressJWT = require("express-jwt");
// const jwt = require("jsonwebtoken");
// const bearerToken = require("express-bearer-token");
// const cors = require("cors");

// const constants = require("../config/constants.json");
// const helper = require("../app/helper");
const invoke = require("../app/invoke");
// const qscc = require("../app/qscc");
const query = require("../app/query");
const logger = require("../util/logger");
// const auth = require("../util/auth");
// const HttpError = require("../util/http-error");

// TODO mover
function getErrorMessage(field) {
  var response = {
    success: false,
    message: field + " field is missing or Invalid in the request",
  };
  return response;
}

// Invoke transaction on chaincode on target peers
exports.invoke = async (req, res, next) => {
  try {
    logger.debug("==================== INVOKE ON CHAINCODE ==================");
    var peers = req.body.peers;
    var chaincodeName = req.params.chaincodeName;
    var channelName = req.params.channelName;
    var fcn = req.body.fcn;
    var args = req.body.args;
    var transient = req.body.transient;
    console.log(`Transient data is ;${transient}`);
    logger.debug("channelName  : " + channelName);
    logger.debug("chaincodeName : " + chaincodeName);
    logger.debug("fcn  : " + fcn);
    logger.debug("args  : " + args);
    if (!chaincodeName) {
      res.json(getErrorMessage("'chaincodeName'"));
      return;
    }
    if (!channelName) {
      res.json(getErrorMessage("'channelName'"));
      return;
    }
    if (!fcn) {
      res.json(getErrorMessage("'fcn'"));
      return;
    }
    if (!args) {
      res.json(getErrorMessage("'args'"));
      return;
    }

    let message = await invoke.invokeTransaction(
      channelName,
      chaincodeName,
      fcn,
      args,
      req.username,
      req.orgname,
      transient
    );
    console.log(`message result is : ${message}`);

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
    console.log("JWT:");
    console.log(req.jwt.username, req.jwt.orgName);
    console.log("Body:");
    console.log(req.body);
    var channelName = req.params.channelName;
    var chaincodeName = req.params.chaincodeName;
    console.log(`chaincode name is :${chaincodeName}`);
    let args = req.query.args;
    let fcn = req.query.fcn;
    let peer = req.query.peer;

    logger.debug("channelName : " + channelName);
    logger.debug("chaincodeName : " + chaincodeName);
    logger.debug("fcn : " + fcn);
    logger.debug("args : " + args);

    if (!chaincodeName) {
      res.json(getErrorMessage("'chaincodeName'"));
      return;
    }
    if (!channelName) {
      res.json(getErrorMessage("'channelName'"));
      return;
    }
    if (!fcn) {
      res.json(getErrorMessage("'fcn'"));
      return;
    }
    if (!args) {
      res.json(getErrorMessage("'args'"));
      return;
    }
    console.log("args==========", args);
    args = args.replace(/'/g, '"');
    args = JSON.parse(args);
    logger.debug(args);

    let message = await query.query(
      channelName,
      chaincodeName,
      args,
      fcn,
      req.username,
      req.orgname
    );

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
//         req.orgname
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
