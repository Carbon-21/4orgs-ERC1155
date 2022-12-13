const elliptic = require('elliptic');
const { KEYUTIL } = require('jsrsasign');


/**
 * This script is responsible for dealing with offline transactions
 */


/**
 * Listens for the page loading event, after which it renders the
 * upload fields for the client's private key and certificate if
 * the client chose the client-side transaction signing mode at signup.
 */
window.addEventListener("load", () => {
  const keyOnServer = localStorage.getItem("keyOnServer");
  const signingFilesElement = document.getElementById("signing-files");

  if (signingFilesElement && keyOnServer) {
    // Renders uploading crypto files element conditionally, depending on the value of keyOnServer
    signingFilesElement.hidden = (keyOnServer == "true") ? true : false;
  }
});

/**
 * Executes a transaction in client-side signing mode.
 * Important reference: https://hyperledger-fabric.readthedocs.io/en/latest/txflow.html
 * @param {*} transaction The dictionary that represents the transaction 
 * to be executed
 * @returns The transaction result
 */
export const offlineTransaction = async (transaction) => {
    
    const privateKey = await readUploadedFile("private-key");
    const certificate = await readUploadedFile("certificate");

    // 1. Request transaction proposal generation
    const body = {
      username: localStorage.getItem("username"),
      transaction: transaction,
      certificate: certificate
    };
    const token = localStorage.getItem("token");
    // console.log("### 1. Request transaction proposal generation");
    // Sends transaction proposal generation request to server
    var url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/generate-proposal`;
    const proposalResponse = await sendToServer("POST", url, body, token);

    // The transaction proposal hash
    const digest = proposalResponse.result.digest;

    // The transaction proposal in Hex
    const proposalHex = proposalResponse.result.proposal;

    // 2. Sign transaction proposal
    // console.log("### 2. Sign transaction proposal");
    const proposalSignature = await signTransaction(digest, privateKey);
    let proposalSignatureHex = Buffer.from(proposalSignature).toString('hex');
    let signedProposal = {
      signature: proposalSignatureHex, 
      proposal: proposalHex
    };

    // 3. Send signed transaction proposal to server
    // console.log("### 3. Send signed transaction proposal to server");
    url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/send-proposal`;
    const sendProposalResponse = await sendToServer("POST", url, 
      signedProposal, token);
    const transactionDigest = sendProposalResponse.result.transactionDigest;
    const transactionHex = sendProposalResponse.result.transaction;
    const proposalResponseStatus = sendProposalResponse.result.status;
    const payload = sendProposalResponse.result.payload;

    if (proposalResponseStatus == 200) {
      // 4. Sign transaction
      // console.log("### 4. Sign transaction");
      let transactionSignature = await signTransaction(transactionDigest, privateKey);
      let transactionSignatureHex = Buffer.from(transactionSignature).toString('hex');
      var signedTransactionProposal = {
        signature: transactionSignatureHex,
        transaction: transactionHex,
      };

      // 5. Send signed transaction to server
      url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/commit-transaction`;
      let commitTransactionResponse = await sendToServer("POST", url,
        signedTransactionProposal, token);

      let commitResult = commitTransactionResponse.result;
      if (commitResult == "SUCCESS")
        return {
          result: "SUCCESS",
          payload: payload
        };
    }
    return {result: "FAILURE"}

}

/**
 * Sends Request to the server. Returns the server's response
 * @param {*} method POST or GET
 * @param {*} url URL of the server
 * @param {*} body Body to be sent to the server in case of POST
 * @param {*} token Bearer token for authorization
 * @returns Response of the server
 */
 const sendToServer = async (method, url, body, token) => {
  var headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (token != null) headers.append("Authorization", "Bearer " + token);

  var init = {
    method: method,
    headers: headers,
  };

  if (method == "POST") init.body = JSON.stringify(body);

  let response = await fetch(url, init);

  if (response.ok) {
    let json = await response.json();
    return json;
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }
}

/**
 * Signs a hashed transaction proposal.
 * @param {*} digest Hash of a transaction proposal
 * @returns The signature of the transaction proposal
 */
const signTransaction = async function(digest, privateKeyPEM){

  //let prvKeyHex = await KEYUTIL.getKeyFromPlainPrivatePKCS8PEM(privateKeyPEM);
  var { prvKeyHex } = KEYUTIL.getKey(privateKeyPEM); 
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

// Helper function for signTransaction
const _preventMalleability = (sig) => {
	const halfOrder = elliptic.curves.p256.n.shrn(1);
	if (sig.s.cmp(halfOrder) === 1) {
		const bigNum = elliptic.curves.p256.n;
		sig.s = bigNum.sub(sig.s);
	}
	return sig;
}

/**
 * Reads a uploaded file and return the text within it.
 * @param {*} fileId The id of the upload field in the DOM.
 * @returns The file's text as a string.
 */
const readUploadedFile = async (fileId) => {
    
  return new Promise((resolve) => {
      
      var reader = new FileReader();
  
      reader.onload = () => {
          resolve(reader.result)
      }
  
      let file = document.getElementById(fileId).files[0];
      reader.readAsText(file)
  })

}