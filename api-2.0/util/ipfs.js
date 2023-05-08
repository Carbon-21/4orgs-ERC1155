// import * as IPFS from "ipfs-core";

// const IPFS = require("ipfs-core");
// const IPFS = import("ipfs-core");
// const ipfs = require("./ipfs-object");
const logger = require("./logger");

let ipfs;

async function loadIpfs() {
  const { create } = await import("ipfs-core"); //done here because of ESM

  logger.info("Creating IPFS object...");

  ipfs = await create();
}

exports.uploadIPFS = async (data) => {
  try {
    //initialize IPFS if it didn't happen already
    if (!ipfs) await loadIpfs();

    //write
    const { cid } = await ipfs.add(JSON.stringify(data));

    return cid;
  } catch (error) {
    console.log(error);
  }
};

exports.getMetadata = async (cid) => {
  try {
    //initialize IPFS if it didn't happen already
    if (!ipfs) await loadIpfs();

    //read
    let ipfsData = "";
    for await (const chunk of ipfs.cat(cid)) {
      ipfsData = Buffer.from(chunk).toString("utf8");
    }

    return ipfsData;
  } catch (error) {
    console.log(error);
  }
};
