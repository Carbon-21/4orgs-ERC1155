const logger = require("./logger");
// import { createHelia } from "helia";

// create a Helia node

let helia;

async function loadIpfs() {
  const { createHelia } = await import("helia");

  logger.info("Creating IPFS object...");

  helia = await createHelia();

  logger.info("Done. Node Peer ID:", helia.libp2p.peerId);
}

exports.writeIPFS = async (data) => {
  try {
    const { unixfs } = await import("@helia/unixfs");

    //initialize IPFS if it didn't happen already
    if (!helia) await loadIpfs();

    //WRITE
    // create a filesystem on top of Helia, in this case it's UnixFS
    const fs = unixfs(helia);

    // we will use this TextEncoder to turn strings into Uint8Arrays
    const encoder = new TextEncoder();

    // add the bytes to your node and receive a unique content identifier
    const cid = await fs.addBytes(encoder.encode("Hello World 101"), helia.blockstore);

    logger.info("Added file:", cid.toString());

    //READ
    // this decoder will turn Uint8Arrays into strings
    const decoder = new TextDecoder();
    let text = "";

    for await (const chunk of fs.cat(cid)) {
      text += decoder.decode(chunk, {
        stream: true,
      });
    }

    console.log("Added file contents:", text);

    //write (not using MFS)
    // const { cid } = await ipfs.add(JSON.stringify(data, { pin: false }));

    // const timestamp = Date.now();
    // // await ipfs.files.mkdir(`/${timestamp}`);
    // // await ipfs.files.mkdir(`/${timestamp}`);
    // console.log("AA");

    // await ipfs.files.write("/tail.json", "teste", { create: true });
    // const { cid } = await ipfs.files.stat("/tail.json");
    // console.log(cid);

    // // let ipfsData = [];
    // let ipfsData = "";
    // for await (const chunk of ipfs.files.read(cid)) {
    //   ipfsData = chunk;
    //   // ipfsData.push(chunk);
    // }
    // // console.log(uint8ArrayConcat(ipfsData).toString());
    // console.log(ipfsData);

    // console.log("BB");
    // // const { cid } = await ipfs.files.write("/tail.json", data);
    // cid = "banana";

    // The address of your files.

    // await ipfs.stop();
    // await ipfs.start();
    // const res = await ipfs.name.publish(cid);
    // logger.info("cabou");
    // You now have a res which contains two fields:
    //   - name: the name under which the content was published.
    //   - value: the "real" address to which Name points.
    // logger.info(`https://gateway.ipfs.io/ipns/${res.name}`);

    // const addr = `/ipfs/${cid.toString()}`;
    // logger.info(addr);
    // const res = await ipfs.name.publish(addr, { allowOffline: true });

    // const { cidd } = await ipfs.add(JSON.stringify({ data: "data" }, { pin: false }));
    // const addrr = `/ipfs/${cidd.toString()}`;
    // await ipfs.name.publish(addrr, { allowOffline: true });

    // const res = await ipfs.name.publish(addr, { allowOffline: true, resolve: false, lifetime: "2h" });

    // const res = await ipfs.name.publish(addr);
    // this.node.name...
    // logger.info(`https://gateway.ipfs.io/ipns/${res.name}`);

    // return cid;
  } catch (error) {
    logger.error("DEU ERRO EIN", error);
  }
};

exports.readIPFS = async (cid) => {
  try {
    //initialize IPFS if it didn't happen already
    if (!helia) await loadIpfs();

    // //resolver ipns address (i.e. get ipfs address)
    // const ipnsAddr = "/ipns/12D3KooWP3YLBzYKvQR3fpdfBXLgdj1FX6VGJTDpLg4JAyPJVXZX";
    // ipfsAddr = "";
    // for await (const name of ipfs.name.resolve(ipnsAddr)) {
    //   ipfsAddr = name;
    //   // an ipfsAddr concat should go here?
    // }
    // logger.info(`IPNS addres ${ipnsAddr} points to ${ipfsAddr}`);

    // const ipfsData = [];
    // for await (const chunk of ipfs.files.read("/tail.json")) {
    //   ipfsData.push(chunk);
    // }
    // console.log(uint8ArrayConcat(ipfsData).toString());

    // //read from ipfs (without MFS)
    // // let ipfsData = "";
    // // for await (const chunk of ipfs.cat(ipfsAddr)) {
    // //   ipfsData = Buffer.from(chunk).toString("utf8");
    // //   // an ipfsData concat should go here?
    // // }

    // logger.info("Data retrieved from the IPFS");

    // return ipfsData;
  } catch (error) {
    logger.error("DEU RUIM", error);
  }
};

////////// IPFS-CORE ////////////
// const logger = require("./logger");

// let ipfs;

// async function loadIpfs() {
//   const { create } = await import("ipfs-core"); //done here because of ESM

//   logger.info("Creating IPFS object...");

//   ipfs = await create();
// }

// exports.writeIPFS = async (data) => {
//   try {
//     //initialize IPFS if it didn't happen already
//     if (!ipfs) await loadIpfs();

//     //write (not using MFS)
//     // const { cid } = await ipfs.add(JSON.stringify(data, { pin: false }));

//     const timestamp = Date.now();
//     // await ipfs.files.mkdir(`/${timestamp}`);
//     // await ipfs.files.mkdir(`/${timestamp}`);
//     console.log("AA");

//     await ipfs.files.write("/tail.json", "teste", { create: true });
//     const { cid } = await ipfs.files.stat("/tail.json");
//     console.log(cid);

//     // let ipfsData = [];
//     let ipfsData = "";
//     for await (const chunk of ipfs.files.read(cid)) {
//       ipfsData = chunk;
//       // ipfsData.push(chunk);
//     }
//     // console.log(uint8ArrayConcat(ipfsData).toString());
//     console.log(ipfsData);

//     console.log("BB");
//     // const { cid } = await ipfs.files.write("/tail.json", data);
//     cid = "banana";

//     // The address of your files.

//     // await ipfs.stop();
//     // await ipfs.start();
//     // const res = await ipfs.name.publish(cid);
//     // logger.info("cabou");
//     // You now have a res which contains two fields:
//     //   - name: the name under which the content was published.
//     //   - value: the "real" address to which Name points.
//     // logger.info(`https://gateway.ipfs.io/ipns/${res.name}`);

//     const addr = `/ipfs/${cid.toString()}`;
//     logger.info(addr);
//     const res = await ipfs.name.publish(addr, { allowOffline: true });

//     // const { cidd } = await ipfs.add(JSON.stringify({ data: "data" }, { pin: false }));
//     // const addrr = `/ipfs/${cidd.toString()}`;
//     // await ipfs.name.publish(addrr, { allowOffline: true });

//     // const res = await ipfs.name.publish(addr, { allowOffline: true, resolve: false, lifetime: "2h" });

//     // const res = await ipfs.name.publish(addr);
//     // this.node.name...
//     logger.info(`https://gateway.ipfs.io/ipns/${res.name}`);

//     return cid;
//   } catch (error) {
//     logger.info("DEU ERRO EIN", error);
//   }
// };

// exports.readIPFS = async (cid) => {
//   try {
//     //initialize IPFS if it didn't happen already
//     if (!ipfs) await loadIpfs();

//     //resolver ipns address (i.e. get ipfs address)
//     const ipnsAddr = "/ipns/12D3KooWP3YLBzYKvQR3fpdfBXLgdj1FX6VGJTDpLg4JAyPJVXZX";
//     ipfsAddr = "";
//     for await (const name of ipfs.name.resolve(ipnsAddr)) {
//       ipfsAddr = name;
//       // an ipfsAddr concat should go here?
//     }
//     logger.info(`IPNS addres ${ipnsAddr} points to ${ipfsAddr}`);

//     const ipfsData = [];
//     for await (const chunk of ipfs.files.read("/tail.json")) {
//       ipfsData.push(chunk);
//     }
//     console.log(uint8ArrayConcat(ipfsData).toString());

//     //read from ipfs (without MFS)
//     // let ipfsData = "";
//     // for await (const chunk of ipfs.cat(ipfsAddr)) {
//     //   ipfsData = Buffer.from(chunk).toString("utf8");
//     //   // an ipfsData concat should go here?
//     // }

//     logger.info("Data retrieved from the IPFS");

//     return ipfsData;
//   } catch (error) {
//     logger.info(error);
//   }
// };

////////// IPFS-MINI ////////////
// const IPFS = require("ipfs-mini");

// exports.writeIPFS = async (dto) => {
//   const ipfs = new IPFS();
//   return ipfs.addJSON(dto);
// };

// exports.readIPFS = async (hash) => {
//   const ipfs = new IPFS({ port: 8080 });
//   return ipfs.cat(hash);
// };
