const logger = require("../util/logger");
const axios = require("axios").default;
const HttpError = require("../util/http-error");

const ipfs = require("../util/ipfs");

exports.getMetadata = async (req, res, next) => {
  // NOTE: NFT token Id
  let tokenId = req.body.tokenId;
  let token = req.body.token || req.session.token;
  let URI;
  // Hash por meio de query no chaincode (GetURI)
  axios
    .get(`http://localhost:4000/query/channels/mychannel/chaincodes/erc1155/getURI?tokenId=${tokenId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
    .then(async function (response) {
      // Get hash (URI) from response
      URI = response.data;
      let metadata = await getMetadataFromURI(URI.result);
      if (Object.keys(metadata).length != 0) {
        return res.status(200).json({
          message: metadata,
          success: true,
        });
      } else {
        return res.status(404).json({ success: false });
      }
    })
    .catch(function (error) {
      logger.error(error);
      return res.status(500).json({
        message: "TokenID do NFT inválido",
        success: false,
      });
    });
};

async function getMetadataFromURI(URI) {
  const hashRegEx = /(?<=ipfs:\/\/).+/; // NOTE: correto, para quando a validacao de URI estiver corrigida
  let hash = hashRegEx.exec(URI);
  hash = hash || URI.slice(7, URI.length - 4); // temporario para remover o http:// e .com
  if (!hash) {
    logger.error("Não conseguimos recuperar o hash do URI fornecido");
    return null;
  }
  logger.debug("Hash received: " + hash);

  // NOTE: IPFS cat
  let metadata;
  try {
    let ipfsData = await ipfs.getMetadata(hash);
    metadata = (await ipfsData) ? JSON.parse(ipfsData) : null;
    // logger.debug("Metadata: " + JSON.stringify(metadata));
  } catch (error) {
    // Como tratar timeouts?
    logger.error(error);
  }
  return metadata;
}

exports.postMetadata = async (req, res, next) => {
  // NOTE: Metadata to be put in IPFS
  let metadata;
  let token = req.body.token || req.session.token;
  let tokenId = req.body.tokenId;
  let hash;

  try {
    metadata = makeMetadata(req.body.metadata);
    // metadata = makeMetadata(reqMetadata);
    tokenId = tokenId || metadata.properties.id;
    hash = await ipfs.uploadIPFS(metadata);
    logger.debug("Hash of uploaded Metadata: " + hash);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: "Falha na aquisição dos metadados",
      success: false,
    });
  }

  // Publicar URI e TokenId no chaincode por meio de chamada em invoke controller (SetURI)
  const URI = `ipfs://${hash}`;
  axios
    .post(
      "http://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/setURI",
      JSON.stringify({
        tokenId: tokenId,
        URI: `http://${hash}.com`, // TODO: Deve se deixar no padrao, que eh somente o URI, mas a validacao impede nesse momento
      }),
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }
    )
    .then(function (response) {
      logger.debug("Publicado Metadados - " + response.statusText);
      return res.status(200).json({ ...response.data, message: "Publicado Metadados e URI setada" });
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
