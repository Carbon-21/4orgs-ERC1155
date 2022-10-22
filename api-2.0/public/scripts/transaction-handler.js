const elliptic = require('elliptic');
const { KEYUTIL } = require('jsrsasign');

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

export const offlineTransaction = async (privateKey, certificate, transaction) => {
    
    // 1. Request transaction proposal generation
    var url = "invoke/channels/mychannel/chaincodes/erc1155/generate-proposal";
    const body = {
        username: localStorage.getItem("username"),
        transaction: transaction,
        certificate: certificate
    };
    const token = localStorage.getItem("token");
    console.log("### 1. Request transaction proposal generation");
    const proposalResponse = await sendToServer("POST", url, body, token);
    const digest = proposalResponse.result.digest;
    const proposalHex = proposalResponse.result.proposal;
    console.log('proposal bytes', Buffer.from(proposalHex, 'hex'));
    console.log('digest =', digest);

    // 2. Sign transaction proposal
    console.log("### 2. Sign transaction proposal");
    const proposalSignature = await signTransaction(digest, privateKey);
    let proposalSignatureHex = Buffer.from(proposalSignature).toString('hex');
    console.log('signature 1 =', proposalSignature);
    console.log('proposalHex =',proposalHex);
    let signedProposal = {
      signature: proposalSignatureHex, 
      proposal: proposalHex
    };

    // 3. Send signed transaction proposal to server
    console.log("### 3. Send signed transaction proposal to server");
    url = "invoke/channels/mychannel/chaincodes/erc1155/send-proposal";
    let sendProposalResponse = await sendToServer("POST", url, 
      signedProposal, token);
}

/**
 * Signs a hashed transaction proposal.
 * @param {*} digest Hash of a transaction proposal
 * @returns The signature of the transaction proposal
 */
const signTransaction = async function(digest, privateKeyPEM){
  console.log('entrou signtransaction')

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

const _preventMalleability = (sig) => {
	const halfOrder = elliptic.curves.p256.n.shrn(1);
	if (sig.s.cmp(halfOrder) === 1) {
		const bigNum = elliptic.curves.p256.n;
		sig.s = bigNum.sub(sig.s);
	}
	return sig;
}