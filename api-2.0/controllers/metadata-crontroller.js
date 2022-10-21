const logger = require("../util/logger");
const axios = require("axios").default;
const HttpError = require("../util/http-error");

const ipfs = require("../util/ipfs");

exports.getMetadata = async (req, res, next) => {
  let tokenId = req.query.tokenId;
  let token = req.headers["authorization"].split(" ")[1];
  let URI;

  try {
    if (req.body.URI) URI = req.body.URI;
    else {
      let response = await axios
      .get(`http://${process.env.HOST}:${process.env.PORT}/query/channels/mychannel/chaincodes/erc1155/getURI?tokenId=${tokenId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      URI = response.data.result;
      console.log('retrieved URI:', URI)
    }
  
    let metadata = await getMetadataFromURI(URI);
    if (Object.keys(metadata).length != 0) {
      return res.status(200).json({
        message: metadata,
        success: true,
      });
    } else {
      return res.status(404).json({ success: false });
    }
  } catch (e) {
    logger.error(e.message);
    return res.status(500).json({
      message: "TokenID do NFT inválido",
      success: false,
    });
  }
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
    return next(new HttpError(500));
  }
  return metadata;
}

exports.postMetadata = async (req, res, next) => {
  // NOTE: Metadata to be put in IPFS
  let metadata;
  let token = req.headers["authorization"].split(" ")[1];
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
      `http://${process.env.HOST}:${process.env.PORT}/invoke/channels/mychannel/chaincodes/erc1155/setURI`,
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

// Metadata Schema v0.2
function makeMetadata(dto) {
  const customData = {
    id: dto.id || "",
    verifier: dto.verifier || "",
    private_verifier: dto.private_verifier || "",
    land_owner: dto.land_owner || "",
    land_info: {
      phyto: dto.phyto || "",
      land: dto.land || "",
      geolocation: dto.geolocation || "",
      area_classification: dto.area_classification || "",
    },
    nft_info: {
      status: dto.status || "",
      nft_type: dto.nft_type || "",
      value: dto.value || "",
      can_mint_sylvas: dto.can_mint_sylvas || "",
      sylvas_minted: dto.sylvas_minted || "",
      bonus_ft: dto.bonus_ft || "",
    },
    compensation_owner: dto.compensation_owner || "",
    compensation_state: dto.compensation_state || "",
    certificate: dto.certificate || "",
    minter: dto.minter || "",
    queue: dto.queue || "",
    custom_notes: dto.custom_notes || "",
  };

  return {
    name: dto.id,
    description: "Carbon 21 NFT",
    image: dto.imageURL || "",
    properties: customData,
  };
}
