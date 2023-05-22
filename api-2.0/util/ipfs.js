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

exports.writeIPFS = async (data) => {
  try {
    //initialize IPFS if it didn't happen already
    if (!ipfs) await loadIpfs();

    //write
    const { cid } = await ipfs.add(JSON.stringify(data, { pin: false }));

    // The address of your files.

    // await ipfs.stop();
    // await ipfs.start();
    // const res = await ipfs.name.publish(cid);
    // logger.info("cabou");
    // You now have a res which contains two fields:
    //   - name: the name under which the content was published.
    //   - value: the "real" address to which Name points.
    // logger.info(`https://gateway.ipfs.io/ipns/${res.name}`);

    const addr = `/ipfs/${cid.toString()}`;
    logger.info(addr);
    const res = await ipfs.name.publish(addr, { allowOffline: true });

    // const { cidd } = await ipfs.add(JSON.stringify({ data: "data" }, { pin: false }));
    // const addrr = `/ipfs/${cidd.toString()}`;
    // await ipfs.name.publish(addrr, { allowOffline: true });

    // const res = await ipfs.name.publish(addr, { allowOffline: true, resolve: false, lifetime: "2h" });

    // const res = await ipfs.name.publish(addr);
    // this.node.name...
    logger.info(`https://gateway.ipfs.io/ipns/${res.name}`);

    return cid;
  } catch (error) {
    logger.info("DEU ERRO EIN", error);
  }
};

exports.readIPFS = async (cid) => {
  try {
    //initialize IPFS if it didn't happen already
    if (!ipfs) await loadIpfs();

    //resolver ipns address (i.e. get ipfs address)
    const ipnsAddr = "/ipns/12D3KooWP3YLBzYKvQR3fpdfBXLgdj1FX6VGJTDpLg4JAyPJVXZX";
    ipfsAddr = "";
    for await (const name of ipfs.name.resolve(ipnsAddr)) {
      ipfsAddr = name;
      // an ipfsAddr concat should go here?
    }
    logger.info(`IPNS addres ${ipnsAddr} points to ${ipfsAddr}`);

    //read from ipfs
    let ipfsData = "";
    for await (const chunk of ipfs.cat(ipfsAddr)) {
      ipfsData = Buffer.from(chunk).toString("utf8");
      // an ipfsData concat should go here?
    }

    logger.info("Data retrieved from the IPFS");

    return ipfsData;
  } catch (error) {
    logger.info(error);
  }
};

// const IPFS = require("ipfs-mini");

// exports.writeIPFS = async (dto) => {
//   const ipfs = new IPFS();
//   return ipfs.addJSON(dto);
// };

// exports.readIPFS = async (hash) => {
//   const ipfs = new IPFS({ port: 8080 });
//   return ipfs.cat(hash);
// };
