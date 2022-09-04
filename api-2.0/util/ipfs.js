// IPFS
const IPFS = require("ipfs-mini");

const projectId = "2DmQoyVkM3PshZd2MvLkIv4xN1x";
const projectSecret = "4159aebfccea07df355bf282859e6b05";

exports.uploadIPFS_String = async (dto) => {
  // console.log("UPLOAD TO IPFS :  " + dto);
  let cdi = "";
  const ipfs = new IPFS();
  ipfs.add(dto.toString(), (err, hash) => {
    if (err) {
      console.log(err);
      return "";
    }
    // console.log("HASH GERADO: " + hash);
    cdi = hash.toString();
  });
  return cdi;
};

exports.uploadIPFS = async (dto) => {
  // console.log("UPLOAD TO IPFS :  " + dto);
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

exports.getMetadata = (hash) => {
  console.log("HASH BUSCADO: " + hash);
  const ipfs = new IPFS({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    auth: projectId + ":" + projectSecret,
    projectId: projectId,
  });
  
  let metadata;
  ipfs.cat(hash, (err, result) => {
    console.log("METADATA RECUPERADA: " + result + " \n Err:" + err);
    metadata = result;
  });
  // NOTE: ipfs.cat e ipfs.catJSON retornam erro: [ipfs-mini] status 405: 405 - Method Not Allowed
  // ipfs.catJSON(hash, (err, result) => {
  //   console.log(err, result);
  //   metadata = JSON.stringify(result);
  //   console.log("METADATA RECUPERADA: "+ metadata)
  // });
  // NOTE: fetch apresenta erro de undefined (nao e' chamado)
  // metadata = fetch('http://127.0.0.1:8080/ipfs/QmTWZRZfMuStYjmH687ys5oTqGCw44vLR4RAEpgX9bwBVo');
  return JSON.stringify(metadata);
};
