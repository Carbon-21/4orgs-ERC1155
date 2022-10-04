const { Client, User } = require("fabric-common");
const invoke = require("../app/invoke");
const query = require("../app/query");
const helper = require("../app/helper");
const logger = require("../util/logger");
const crypto = require('crypto')
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

exports.generateTransactionProposal = async function (req, res){
  let transaction_proposal = req.body.transaction;
  // user: d8
  let certPem = `-----BEGIN CERTIFICATE-----
  MIICpzCCAk2gAwIBAgIUfjz2czIRojqbTe8/RFknapunCpswCgYIKoZIzj0EAwIw
  aDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK
  EwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt
  Y2Etc2VydmVyMB4XDTIyMTAwNDE4MjUwMFoXDTIzMTAwNDE4MzAwMFowQTEyMA0G
  A1UECxMGY2xpZW50MA0GA1UECxMGY2FyYm9uMBIGA1UECxMLZGVwYXJ0bWVudDEx
  CzAJBgNVBAMTAmQ4MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAExutN6Z5ZW0Yo
  PydIRmO3y5PgWivYXQsDS0GRupeH3Xz309JWfKkcsfJd64DScQXJZavQsyHlhCp0
  t+N1KLI8K6OB+zCB+DAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0TAQH/BAIwADAdBgNV
  HQ4EFgQUEUHODt/LV3AMpQQDpYtzA8dxFX4wHwYDVR0jBBgwFoAUyYDsQOohQyzK
  fjq7JhPyBNQ8sbowLwYDVR0RBCgwJoICZDiCD3d3dy5leGFtcGxlLmNvbYIPYXBp
  LmV4YW1wbGUuY29tMGcGCCoDBAUGBwgBBFt7ImF0dHJzIjp7ImhmLkFmZmlsaWF0
  aW9uIjoiY2FyYm9uLmRlcGFydG1lbnQxIiwiaGYuRW5yb2xsbWVudElEIjoiZDgi
  LCJoZi5UeXBlIjoiY2xpZW50In19MAoGCCqGSM49BAMCA0gAMEUCIQDu23L+ZicO
  qctWMTgbdVVs1yAhjr5FGgKEhhARIZoBEQIgJ3S802qs6j+uhI9W2LPLIj25q40a
  9VAYBKzHoFQLjxE=
  -----END CERTIFICATE-----`;
  try {
    //const channel = client.getChannel('mychannel');

    var { proposal, tx_id } = channel.generateUnsignedProposal(transaction_proposal, 'CarbonMSP', certPem);
    transactionBuffer.push({proposal: proposal});
    //Hash the transaction proposal
    var proposalBytes = proposal.toBuffer();
    console.log('typeof buffer=', typeof proposalBytes)
    var digest = client.getCryptoSuite().hash(proposalBytes);
    let proposalHex = Buffer.from(proposalBytes).toString('hex');
    console.log('proposal 1', proposalBytes);
    return res.json({
      result: {digest: digest, proposal: proposalHex}
    });
  } catch (err) {
    console.log(err);
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, errMessage[1]));
  }
}

exports.sendSignedProposal = async function (req, res, next){
  try {
    let signatureHex = req.body.signature;
    let proposalHex = req.body.proposal;
    //Hex to bytes
    let signature = Uint8Array.from(Buffer.from(signatureHex, 'hex'));
    let proposalBytes = Buffer.from(proposalHex, 'hex');

    console.log('signature 2', signature);
    console.log('proposal 2', proposalBytes);
  
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
    console.log('######Proposal responses:', proposalResponses);
  
    // 5. Generate unsigned transaction
    transaction_request = {
      proposalResponses: proposalResponses,
      //proposal: proposalBytes,
      proposal: transactionBuffer[0].proposal
    };

    transactionBuffer[0].transaction_request = transaction_request;
  
    var commitProposal = await channel.generateUnsignedTransaction(transaction_request);
    let transactionBytes = commitProposal.toBuffer();
    let transactionHex = Buffer.from(transactionBytes).toString('hex');
    var transactionDigest = client.getCryptoSuite().hash(transactionBytes);
    return res.json({
      result: {transaction: transactionHex, transactionDigest: transactionDigest}
    });
  } catch (err) {
    console.log(err);
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, errMessage[1]));
  }
  
}

exports.commitSignedTransaction = async function (req, res){
  try {
    let signatureHex = req.body.signature;
    let transactionHex = req.body.transaction;
    //Hex to bytes
    let signature = Buffer.from(signatureHex, 'hex');
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
    return res.json({result: commitTransactionResponse.status});

  } catch (err) {
    console.log(err);
    const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, errMessage[1]));
  }
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
