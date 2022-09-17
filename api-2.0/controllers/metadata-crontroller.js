const logger = require("../util/logger");
const invoke = require("../app/invoke");
const HttpError = require("../util/http-error");

const ipfs = require("../util/ipfs");

exports.getMetadata = async (req, res, next) => {
  // NOTE: NFT token Id
  // let tokenId = req.body.tokenId;

  // NOTE: hash (cid) correspondente //NOTE: idealmente sera usado o tokenId para recuperar o hash
  // let hash;
  let hash = req.body.cid;

  // const hash = "QmbAcm3pxgpx9cBtdBBnM1fjQ3U4SUZJ3i3rH9UDKQsSbD"; // json file 
  // const hash = "QmSDUSRyrNUJEqXcmr39N46M43qhjDk2raFV6RH38Sievh"; // json file (mais atual, ainda sera implementado o schema)

  // Hash por meio de chamada no chaincode (GetURI)

  // axios
  //   .post(
  //     "http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155",
  //     JSON.stringify({
  //       fcn: "GetURI",
  //       args: [tokenId],
  //     }),
  //     { method: "POST", headers: { "Content-Type": "application/json" } }
  //   )
  //   .then(function (response) {
  //     // Get hash (cid) from response
  //     hash = response;
  //   })
  //   .catch(function (error) {
  //     logger.error(error);
  //     return res.status(500).json({
  //       message: "TokenID do NFT inválido",
  //       success: false,
  //     });
  //   });

  logger.debug("Hash received: " + hash);

  // NOTE: IPFS cat
  let metadata;
  try {
    let ipfsData = await ipfs.getMetadata(hash);
    metadata = (await ipfsData) ? JSON.parse(ipfsData) : null; // NOTE: Um ou dois parsers, dependendo de como é montado o metadata com o schema final
    logger.debug("Metadata: " + JSON.stringify(metadata));
  } catch (error) {
    logger.error(error);
  }

  // NOTE: resposta

  if (metadata) {
    return res.status(200).json({
      message: metadata,
      success: true,
    });
  } else {
    return next(new HttpError(404));
  }
};

exports.postMetadata = async (req, res, next) => {
  // NOTE: Metadata to be put in IPFS (usar schema padronizado)
  let metadata = {
    exemplo: 1,
    tokenId: "example",
  };

  let tokenId = metadata.tokenId;

  try {
    let hash = await ipfs.uploadIPFS(metadata); //NOTE: O await não esta funcionando corretamente, o codigo continua rodando e o hash é gerado posteriormente (ao log abaixo por exemplo)
    logger.debug("Hash of uploaded Metadata: " + hash);
    // TODO: debugando, remover retorno posteriormente
    if (hash) {
      return res.status(200).json({
        message: hash,
        success: true,
      });
    }
  } catch (error) {
    logger.error(error);
  }

  // Publicar Hash e TokenId no chaincode por meio de chamada (SetURI)

  // axios
  //   .post(
  //     "http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155",
  //     JSON.stringify({
  //       fcn: "SetURI",
  //       args: [tokenId, hash],
  //     }),
  //     { method: "POST", headers: { "Content-Type": "application/json" } }
  //   )
  //   .then(function (response) {
  //     logger.debug("Publicado Metadados - " + response);
  //     return res.status(200).json({
  //       message: response",
  //       success: true,
  //     });
  //   })
  //   .catch(function (error) {
  //     logger.error(error);
  //     return res.status(500).json({
  //       message: "Falha na publicação dos metadados no chaincode",
  //       success: false,
  //     });
  //   });
};
