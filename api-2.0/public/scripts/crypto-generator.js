const ecdsa = require('./bundles/ecdsacsr-bundle.js');
const elliptic = require('elliptic');
const { KEYUTIL } = require('jsrsasign');

/**
 * Main function, responsible for generating the user's ECDSA Private Key and CSR
 * @param {*} username The user's username
 * @returns The user's cryptographic materials
 */
export const generateCryptoMaterial = async function (username) {
  try{
    let [publicKey, privateKey, cryptoPK] = await generateKeyPair();
    var domains = [ username, 'www.example.com', 'api.example.com' ];
    let csr = await ecdsa({ key: privateKey, domains: domains });
    console.log('CSR\n',csr);
    return {csr: csr, privateKey: privateKey, cryptoPK: cryptoPK};

  } catch (e) {
    console.log(e.message);
  }

} 

/**
 * Decodes Base-64 Strings.
 * @param {*} buf Buffer
 * @returns 
 */
const ab2str = async function (buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

/**
 * Exports a CryptoKey object into a PEM-encoded key string.
 * @param {*} keyType If the key is private or public.
 * @param {*} key The CryptoKey object that represents the user's key.
 * @returns The PEM-encoded key string.
 */
const exportCryptoKey = async function (keyType, key) {
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

/**
 * Generates a pair of public and private ECDSA keys.
 * @returns The ECDSA key pair.
 */
const generateKeyPair = async function () {
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
  return [publicKey, privateKey, keyPair.privateKey];
  } catch(e) {
    return e.message
  }
}

/**
 * Executes the download of the user's private key and certificate by the browser.
 * @param {*} name The username.
 * @param {*} material The string that will be downloaded.
 * @param {*} materialType "privateKey" if the string is a private key; "certificate" if the string is a certificate.
 */
export const downloadCrypto = async function (name, material, materialType) {
  let filename;
  if (materialType == "privateKey") filename = `pk_${name}.pem`;
  else if (materialType == "certificate") filename = `certificate_${name}.pem`;
  else throw new Error(`InvalidArgumentException - materialType ${materialType} is not valid`);

  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(material));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}