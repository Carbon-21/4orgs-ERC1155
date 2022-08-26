const ecdsa = require('./ecdsacsr.js');

console.log('entrou script ecdsa');

window.generateCryptoMaterial = async function (username) {
  try{
    let [publicKey, privateKey] = await window.generateKeyPair();
    var domains = [ username, 'www.example.com', 'api.example.com' ];
    let csr = await ecdsa({ key: privateKey, domains: domains });
    console.log('CSR\n',csr);
    //return csr;
    return {csr: csr, privateKey: privateKey};
    //document.getElementById("pk").innerHTML = "<pre>" + privateKey + "</pre>";
    //document.getElementById("csr").innerHTML = "<pre>" + csr + "</pre>";
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
  let keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256"
    },
    true,
    ["sign", "verify"]
  );

  //console.log('keyPair = ', keyPair)
  let privateKey = await exportCryptoKey('private', keyPair.privateKey)
  console.log(privateKey)

  let publicKey = await exportCryptoKey('public', keyPair.publicKey)
  console.log(publicKey)
  return [publicKey, privateKey]
  } catch(e) {
    return e.message
  }
}

window.downloadCrypto = async function (material, materialType) {
  let filename;
  if (materialType == "privateKey") filename = "pk.pem";
  else if (materialType == "certificate") filename = "certificate.pem";
  else throw new Error(`InvalidArgumentException - materialType ${materialType} is not valid`);

  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(material));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
  

}