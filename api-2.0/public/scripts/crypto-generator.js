const ecdsa = require('./ecdsacsr.js');
const elliptic = require('elliptic');
const { KEYUTIL } = require('jsrsasign');

console.log('entrou script ecdsa');

window.generateCryptoMaterial = async function (username) {
  try{
    console.log('flag 1a');
    let [publicKey, privateKey, cryptoPK] = await window.generateKeyPair();
    console.log('flag 1b');
    var domains = [ username, 'www.example.com', 'api.example.com' ];
    let csr = await ecdsa({ key: privateKey, domains: domains });
    console.log('flag 1c');
    console.log('CSR\n',csr);
    //return csr;
    return {csr: csr, privateKey: privateKey, cryptoPK: cryptoPK};
    //document.getElementById("pk").innerHTML = "<pre>" + privateKey + "</pre>";
    //document.getElementById("csr").innerHTML = "<pre>" + csr + "</pre>";
  } catch (e) {
    console.log(e.message);
  }

} 

window.ab2str = async function (buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

window.str2ab = async function (str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
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
  console.log('flag 1d');
  let keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256"
    },
    true,
    ["sign"]
  );

  //console.log('keyPair = ', keyPair)
  let privateKey = await exportCryptoKey('private', keyPair.privateKey)
  console.log(privateKey)
  console.log('antes do teste')
  //let objeto = await window.importPrivateKey(privateKey);
  //console.log('depois do teste',objeto)
  let publicKey = await exportCryptoKey('public', keyPair.publicKey)
  console.log(publicKey)
  return [publicKey, privateKey, keyPair.privateKey];
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

// window.signTransaction = async function (message /*, privateKey*/) {
//   let privateKey = "-----BEGIN PRIVATE KEY-----\n\
//   MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgxej0Ek7NVlv2f/TxHhrQLQHV76IuECZ8Vs0YNEb6SQyhRANCAARt15BmyMMwIJ1C59aMPivsIveM4mwiGmXPwoFZNVS7Qc/44khMl6SodVSrep73U1590uAtfq2aMzYFNG3P7gUi\n\
//   -----END PRIVATE KEY-----";
//   let cryptoPK = await window.importPrivateKey(privateKey);
//   console.log('object PK = ',cryptoPK);
//   let enc = new TextEncoder();
//   let encoded = enc.encode(message);
//   let signature = await window.crypto.subtle.sign(
//     {
//       name: "ECDSA",
//       hash: {name: "SHA-256"},
//     },
//     cryptoPK,
//     encoded
//   );
//   return signature;
// }

//
// Helper function
//
const _preventMalleability = (sig) => {
	const halfOrder = elliptic.curves.p256.n.shrn(1);
	if (sig.s.cmp(halfOrder) === 1) {
		const bigNum = elliptic.curves.p256.n;
		sig.s = bigNum.sub(sig.s);
	}
	return sig;
}

window.signTransaction = async function(digest/*,privateKey*/){
  console.log('entrou signtransaction')
  const privateKeyPEM = 
    `-----BEGIN PRIVATE KEY-----
    MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgySowcCjI2f5RheYQhX+JGa01/KfmRaIE4b/N1zaXNHShRANCAATG603pnllbRig/J0hGY7fLk+BaK9hdCwNLQZG6l4fdfPfT0lZ8qRyx8l3rgNJxBcllq9CzIeWEKnS343Uosjwr
    -----END PRIVATE KEY-----`
  //let prvKeyHex = await KEYUTIL.getKeyFromPlainPrivatePKCS8PEM(privateKeyPEM);
  var { prvKeyHex } = KEYUTIL.getKey(privateKeyPEM, 'wisekey'); 
  console.log('prvKeyHex ',prvKeyHex)
  const EC = elliptic.ec;
  const ecdsaCurve = elliptic.curves['p256'];
  const ecdsa = new EC(ecdsaCurve);
  const signKey = await ecdsa.keyFromPrivate(prvKeyHex, 'hex');
  let sig = await ecdsa.sign(Buffer.from(digest, 'hex'), signKey);
  sig = _preventMalleability(sig);

  // now we have the signature, next we should send the signed transaction proposal to the peer
  const signature = Buffer.from(sig.toDER());
  return signature;
}

/*
(This code is from Web Crypto API website)
Import a PEM encoded RSA private key, to use for RSA-PSS signing.
Takes a string containing the PEM encoded key, and returns a Promise
that will resolve to a CryptoKey representing the private key.
*/
window.importPrivateKey = async function (pem) {
  try{
    // fetch the part of the PEM string between header and footer
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
    console.log('substring\n',pemContents);
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    console.log('flag9');
    const binaryDer = window.str2ab(binaryDerString);
    console.log('flag10');
    let cryptoPK = window.crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign"]
    );
    return cryptoPK;
    } catch(e){
      console.log("erro miportkey:", e.message)
    }
}