const logger = require("../util/logger");
const HttpError = require("../util/http-error");
// const { setURI } = require("../controllers/invoke-controller");
const ipfs = require("../util/ipfs");
const { getBlockchainTailLocal, getWorldStateLocal } = require("./query-controller");
const { setURILocal } = require("./invoke-controller");
const { getURILocal } = require("./query-controller");

//post blockchain's tail to the IPFS
//used by crontab
exports.postTransparencyLog = async () => {
  const chaincodeName = "erc1155";
  const channelName = "mychannel";
  const org = "Carbon";

  try {
    //get tail
    let tail = await getBlockchainTailLocal(chaincodeName, channelName);
    tail = JSON.stringify(tail, null, 4);

    //get ws
    const ws = await getWorldStateLocal(chaincodeName, channelName);

    //write tail, ws and signature(tails+ws) on ipfs
    const cid = await ipfs.writeIPFS(tail, ws);
    cid ? logger.info("Crontrab done! Transparency log posted to IPFS") : logger.error("Crontrab failed! Transparency log not posted to IPFS");
  } catch (error) {
    return new HttpError(500, error);
  }
};

//get last block posted to IPFS
//deprecated: IPFS' cid not save onchain anymore. we are now using IPNS. "last ipfs block" isn't displayed on logs page anymore, because... why doing it?
exports.getLatestIPFSBlock = async (req, res, next) => {
  const chaincodeName = "erc1155";
  const channelName = "mychannel";
  const org = "Carbon";

  //get get date in dd-mm-yyyy format
  let currentDate = new Date();
  currentDate = currentDate.getDate() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getFullYear();

  try {
    //get IPFS URI from the ledger, using current date as key
    const uri = await getURILocal(String(currentDate), org, chaincodeName, channelName);
    if (!uri) return next(new HttpError(404, "Nenhum bloco adicionado ao IPFS"));
    logger.info("IFPS URI retrieved from the ledger:", uri);

    //get block info from the IPFS
    let ipfsData = await ipfs.readIPFS(uri.replace("ipfs://", ""));
    let ipfsDataJson = (await ipfsData) ? JSON.parse(ipfsData) : null;
    logger.info("Block data retrieved from the IPFS");

    return res.json({ tail: ipfsDataJson });
  } catch (error) {
    return next(new HttpError(500));
  }
};
