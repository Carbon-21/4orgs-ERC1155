const ecdsa = require('./ecdsacsr.js');

/*const pk = "-----BEGIN PRIVATE KEY-----\nMHcCAQEEIBZITi6t1modTujGMM4bfPCM98xKSX0ho2nN+cv+Qv5/oAoGCCqGSM49\nAwEHoUQDQgAExBWoYJKUDWBIHCT3gtienGhW1Wo18RKOKb5tmdpM7dJZ1CpEwdoI\nDPqfM1oh4xITaUPwBbth8odbF5Ri9kkYFQ==\n-----END PRIVATE KEY-----"
const pk2 = "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgKU/aN5kBu+kXnP4vTxTY5Ir0f4Haw8Aotfa7w++DaDmhRANCAATnjgquRo6VLad1Jf5V2jxZwzeY5iQwILViQxOuaApLuPdyA3eNev2HSSEy2hqFos/rmkqXfmc5W1D5sGlN1LLh\n-----END PRIVATE KEY-----"
const pk3 = "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAKj34GkxFhD90vcNLYLInFEX6Ppy1tPf9Cnzj4p4WGeKLs1Pt8Qu\nKUpRKfFLfRYC9AIKjbJTWit+CqvjWYzvQwECAwEAAQJAIJLixBy2qpFoS4DSmoEm\no3qGy0t6z09AIJtH+5OeRV1be+N4cDYJKffGzDa88vQENZiRm0GRq6a+HPGQMd2k\nTQIhAKMSvzIBnni7ot/OSie2TmJLY4SwTQAevXysE2RbFDYdAiEBCUEaRQnMnbp7\n9mxDXDf6AU0cN/RPBjb9qSHDcWZHGzUCIG2Es59z8ugGrDY+pxLQnwfotadxd+Uy\nv/Ow5T0q5gIJAiEAyS4RaI9YG8EWx/2w0T67ZUVAw8eOMB6BIUg0Xcu+3okCIBOs\n/5OiPgoTdSy7bcF9IGpSE8ZgGKzgYQVZeN97YE00\n-----END RSA PRIVATE KEY-----"
const pk4 = 
  "-----BEGIN PRIVATE KEY-----\n\
  MHQCAQEEIFL3sLnioGcDvHWM/BPlNw96BOx1KKco2qsq4UwhQUosoAcGBSuBBAAK\n\
  oUQDQgAEXs1Fmq4QdPAbn3NycdEU+HOjc3kW9efbso2kI/vdDTWcSCMk310s53G3\n\
  tRClDBPPuuJAsKghbPfaTaUpmXFCNA==\n\
  -----END PRIVATE KEY-----"

var domains = [ 'example.com', 'www.example.com', 'api.example.com' ];

console.log("testegh");
ecdsa({ key: pk2, domains: domains }).then(function (csr) {
    console.log('CSR PEM:');
    console.log(csr);
  });*/
console.log('entroudsa');

//document.getElementById("button").addEventListener("click", generateCryptoMaterial);

window.teste = () => {
  console.log('entrou na f teste');
};

window.generateCryptoMaterial = async function () {
  try{
    console.log('flag1')
    let [publicKey, privateKey] = await window.generateKeyPair();
    console.log('privateKey\n',privateKey);
    var domains = [ 'example.com', 'www.example.com', 'api.example.com' ];
    let csr = await ecdsa({ key: privateKey, domains: domains });
    console.log('CSR\n',csr);
    document.getElementById("pk").innerHTML = "<pre>" + privateKey + "</pre>";
    document.getElementById("csr").innerHTML = "<pre>" + csr + "</pre>";
  } catch (e) {
    console.log(e.message);
  }

} 

window.ab2str = async function (buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

window.exportCryptoKey = async function (keyType, key) {
  try {
    let exported, exportedAsString, exportedAsBase64, pemExported;
    switch (keyType) {
      case "private":
        exported = await window.crypto.subtle.exportKey(
          "pkcs8",
          key
        );
        exportedAsString = await ab2str(exported);
        exportedAsBase64 = window.btoa(exportedAsString);
        pemExported = `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;
        return pemExported;
      case "public":
        exported = await window.crypto.subtle.exportKey(
          "spki",
          key
        );
        exportedAsString = ab2str(exported);
        exportedAsBase64 = window.btoa(exportedAsString);
        pemExported = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
        return pemExported;
    }
  } catch (e) {
    console.log(e.message)
  }
}

window.generateKeyPair = async function () {
  try {
    console.log('flag2')
  let keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256"
    },
    true,
    ["sign", "verify"]
  );

  console.log('keyPair = ', keyPair)
  let privateKey = await exportCryptoKey('private', keyPair.privateKey)
  console.log(privateKey)

  let publicKey = await exportCryptoKey('public', keyPair.publicKey)
  console.log(publicKey)
  return [publicKey, privateKey]
  } catch(e) {
    return e.message
  }
}