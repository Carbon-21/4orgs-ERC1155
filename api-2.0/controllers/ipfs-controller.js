const logger = require("../util/logger");
const HttpError = require("../util/http-error");
// const { setURI } = require("../controllers/invoke-controller");
const ipfs = require("../util/ipfs");
const { getBlockchainTailLocal } = require("./query-controller");

//post blockchain's tail to the IPFS
exports.postTransparencyLog = async () => {
  try {
    const tail = await getBlockchainTailLocal("erc1155", "mychannel");

    const hash = await ipfs.uploadIPFS(tail);
    logger.info("Daily crontrab done! Transparency log (blockchain's tail) posted to IPFS. Hash: " + hash);

    let ipfsData = await ipfs.getMetadata(hash);
    logger.debug("Data retrieved from the IPFS: " + ipfsData);
  } catch (error) {
    return new HttpError(500, error);
  }
};
