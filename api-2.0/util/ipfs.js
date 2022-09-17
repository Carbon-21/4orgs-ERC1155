const IPFS = require("ipfs-mini");

exports.uploadIPFS = async (dto) => {
  let cdi = "";
  const ipfs = new IPFS();
  ipfs.addJSON(dto, (err, hash) => {
    if (err) {
      console.log(err);
      return "";
    }
    console.log("HASH GERADO: " + hash);
    cdi = hash.toString();
  });
  return cdi;
};

exports.getMetadata = async (hash) => {
  const ipfs = new IPFS({port: 8080});
  return ipfs.cat(hash);
  // let metadata;
  // return ipfs.cat(hash, (err, result) => {
  //   // console.log("METADATA RECUPERADA: " + result + " \n Err:" + err);
  //   metadata = result;
  // })
  return metadata.slice(1, -1);
};
