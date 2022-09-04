// IPFS
const IPFS = require("ipfs-mini");

exports.uploadIPFS = async (dto) => {
  console.log("UPLOAD TO IPFS :  " + dto);
  const ipfs = new IPFS();
  ipfs.add(dto.toString(), (err, hash) => {
    if (err) {
      console.log(err);
      return "";
    }
    console.log("HASH GERADO: " + hash);
    return hash;
  });
};

exports.getMetadata = (hash) => {
  const ipfs = new IPFS();
  ipfs.catJSON(hash, (err, result) => {
    console.log(err, result);
  });
};
