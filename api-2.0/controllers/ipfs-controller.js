const logger = require("../util/logger");
const HttpError = require("../util/http-error");
// const { setURI } = require("../controllers/invoke-controller");
const ipfs = require("../util/ipfs");
const { getBlockchainTailLocal } = require("./query-controller");
const { setURILocal } = require("./invoke-controller");
const { getURILocal } = require("./query-controller");

//get today's block posted to IPFS
exports.getLatestIPFSBlock = async (req, res, next) => {
  const chaincodeName = "erc1155";
  const channelName = "mychannel";
  const org = "Carbon";

  //get get date in dd-mm-yyyy format
  let currentDate = new Date();
  currentDate = currentDate.getDate() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getFullYear();

  try {
    //get IPFS URI from the ledger
    const uri = await getURILocal(String(currentDate), org, chaincodeName, channelName);
    if (!uri) return next(new HttpError(404, "Nenhum bloco adicionado ao IPFS"));
    logger.info("IFPS URI retrieved from the ledger:", uri);

    //get block info from the IPFS
    let ipfsData = await ipfs.getMetadata(uri.replace("ipfs://", ""));
    let ipfsDataJson = (await ipfsData) ? JSON.parse(ipfsData) : null;
    logger.info("Block data retrieved from the IPFS");

    return res.json({ tail: ipfsDataJson });
  } catch (error) {
    return next(new HttpError(500));
  }
};

//post blockchain's tail to the IPFS
//used by crontab
exports.postTransparencyLog = async () => {
  const chaincodeName = "erc1155";
  const channelName = "mychannel";
  const org = "Carbon";

  try {
    const tail = await getBlockchainTailLocal(chaincodeName, channelName);

    const hash = await ipfs.uploadIPFS(tail);
    logger.info("Daily crontrab done! Transparency log (blockchain's tail) posted to IPFS");

    const uri = await setURILocal(hash, org, chaincodeName, channelName);
    logger.info("IFPS URI added to the ledger:", uri);
  } catch (error) {
    return new HttpError(500, error);
  }
};
