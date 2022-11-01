const IPFS = require("ipfs-mini");

exports.uploadIPFS = async (dto) => {
  const ipfs = new IPFS();
  return ipfs.addJSON(dto);
};

exports.getMetadata = async (hash) => {
  const ipfs = new IPFS({port: 8080});
  return ipfs.cat(hash);
};
