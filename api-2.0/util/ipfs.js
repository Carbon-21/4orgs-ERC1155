// IPFS
const IPFS = require("ipfs-mini");

exports.uploadIPFS = (dto) => {
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
