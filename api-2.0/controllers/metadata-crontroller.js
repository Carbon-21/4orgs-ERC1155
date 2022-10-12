const logger = require("../util/logger");
const axios = require("axios").default;
const HttpError = require("../util/http-error");

const ipfs = require("../util/ipfs");

exports.getMetadata = async (req, res, next) => {
  // NOTE: NFT token Id
  let tokenId = req.body.tokenId;
  // let token = req.session.token;
  let token = req.body.token;
  let URI;

  // Hash por meio de chamada no chaincode (GetURI)
  axios
    .post(
      "http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155",
      JSON.stringify({
        fcn: "GetURI",
        args: [tokenId],
      }),
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }
    )
    .then(function (response) {
      // Get hash (URI) from response
      URI = response;
    })
    .catch(function (error) {
      logger.error(error);
      return res.status(500).json({
        message: "TokenID do NFT inválido",
        success: false,
      });
    });

  const hashRegEx = /(?<=ipfs:\/\/).+/;
  let hash = hashRegEx.exec(URI) || "";

  //---------- NOTE: Testes - idealmente sera usado o tokenId para recuperar o hash
  hash = req.body.cid;
  // hash = "QmU93oY6pU3f64qd2fBiHEgVj8Va4pFUnCAYGbBYjTaeio"; // json file (mais atual, com schema v0.1)
  logger.debug("Hash received: " + hash);
  //---------

  // NOTE: IPFS cat
  let metadata;
  try {
    let ipfsData = await ipfs.getMetadata(hash);
    metadata = (await ipfsData) ? JSON.parse(ipfsData) : null;
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
  // NOTE: Metadata to be put in IPFS
  let metadata;
  let token = req.session.token;
  let tokenId;
  let hash;

  // let reqMetadata = {
  //   id: req.body.nftId,
  //   land_info: {
  //     land: req.body.location,
  //     biome: req.body.phyto,
  //   },
  // };

  try {
    metadata = makeMetadata(req.body.metadata);
    // metadata = makeMetadata(reqMetadata);
    tokenId = metadata.properties.id;
    hash = await ipfs.uploadIPFS(metadata);
    logger.debug("Hash of uploaded Metadata: " + hash);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: "Falha na aquisição dos metadados",
      success: false,
    });
  }

  // Publicar URI e TokenId no chaincode por meio de chamada (SetURI)

  const URI = `ipfs://${hash}`;
  axios
    .post(
      "http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155",
      JSON.stringify({
        fcn: "SetURI",
        args: ["", tokenId, URI],
      }),
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }
    )
    .then(function (response) {
      logger.debug("Publicado Metadados - " + response);
      return res.status(200).json({
        message: response,
        success: true,
      });
    })
    .catch(function (error) {
      logger.error(error);
      return res.status(500).json({
        message: "Falha na publicação dos metadados no chaincode, URI: " + URI,
        success: false,
      });
    });
};

// TODO: avaliar tipagem, estrutura e dados
// Metadata Schema v0.1 : QmV2gJwWbDh2E3zzVV1CRpR3prgC6fZ828Yszs9HYxmezp
function makeMetadata(dto) {
  const customData = {
    id: dto.id || "",
    verifier: dto.verifier || "",
    compensation_owner: dto.compensation_owner || "",
    land_owner: dto.land_owner || "",
    land_info: {
      land: dto.land || "",
      area_classification: dto.area_classification || "",
      biome: dto.biome || "",
      geolocation: dto.geolocation || "",
    },
    value: dto.value || "",
    balance: dto.balance || "",
    status: dto.status || "",
    compensation_state: dto.compensation_state || "",
    certificate: dto.certificate || "",
    bonus_ft: dto.bonus_ft || "",
    minter: dto.minter || "",
    queue: dto.queue || "",
    can_mint_sylvas: dto.can_mint_sylvas || "",
    nft_type: dto.nft_type || "",
  };

  return {
    name: dto.id,
    description: "Carbon 21 NFT",
    image: dto.imageURL || "",
    properties: customData,
  };
}
