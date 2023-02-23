const logger = require("../util/logger");
const HttpError = require("../util/http-error");
// const { setURI } = require("../controllers/invoke-controller");
const ipfs = require("../util/ipfs");
const { getBlockchainTailLocal } = require("./query-controller");
const { setURILocal } = require("./invoke-controller");

//post blockchain's tail to the IPFS
exports.postTransparencyLog = async () => {
  const chaincodeName = "erc1155";
  const channelName = "mychannel";
  const org = "Carbon";

  try {
    const tail = await getBlockchainTailLocal(chaincodeName, channelName);

    const hash = await ipfs.uploadIPFS(tail);
    logger.info("Daily crontrab done! Transparency log (blockchain's tail) posted to IPFS");

    // let ipfsData = await ipfs.getMetadata(hash);
    // logger.debug("Data retrieved from the IPFS: " + ipfsData);

    const uri = await setURILocal(hash, org, chaincodeName, channelName);
    logger.info("IFPS URI added to the ledger: ", uri);
  } catch (error) {
    return new HttpError(500, error);
  }
};

exports.getLatestIPFSBlock = async (req, res, next) => {};
