//
// Imports
//
var Client = require('fabric-client');
var path = require('path');
var util = require('util');
var fs = require('fs');
const crypto = require('crypto');
const elliptic = require('elliptic');
const { KEYUTIL } = require('jsrsasign');
const config = require('./config');

//
// Script configuartion variables
//
// Configurações devem receber parâmetros do front
const certPem = `-----BEGIN CERTIFICATE-----
MIICdDCCAhugAwIBAgIUTTanCll1TN8+WBuw3wvdEyE955kwCgYIKoZIzj0EAwIw
aDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK
EwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt
Y2Etc2VydmVyMB4XDTIyMDkzMDA0MDYwMFoXDTIzMDkzMDA0MTEwMFowSzELMAkG
A1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMQ8wDQYDVQQLEwZjbGll
bnQxEjAQBgNVBAMTCXdpc2VrZXkyMDBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IA
BARexe8YHerzu8NR7tJL8fMMZpW5Bw/JF2ubEkpZyWkZy5u89bZLeOKQnj8rBQJe
bI5bpM07Wdg3qpormouZpZijgb8wgbwwDgYDVR0PAQH/BAQDAgeAMAwGA1UdEwEB
/wQCMAAwHQYDVR0OBBYEFAD6uNkmTMbnE09/nQmpdTgzlPuPMB8GA1UdIwQYMBaA
FOFrQHPZlJGR6592VG2UCPq6j1h0MFwGCCoDBAUGBwgBBFB7ImF0dHJzIjp7Imhm
LkFmZmlsaWF0aW9uIjoiIiwiaGYuRW5yb2xsbWVudElEIjoid2lzZWtleTIwIiwi
aGYuVHlwZSI6ImNsaWVudCJ9fTAKBggqhkjOPQQDAgNHADBEAiApC0mh2ITb4Uvo
0Q/QmmC3CuZmPeGgsTOaQPNCwO9BWAIgTxo0bcbx+xrasAOOWGPXD0C3cDFKfHYc
istt/fDTaYc=
-----END CERTIFICATE-----`

const privateKeyPEM = `-----BEGIN EC PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: AES-128-CBC,302824875FAE0EB481AF731146E5F0F0

ySDBHPV6dkBZekQwBMsTo20fVzDwbgxZCALrd5jwIblqYW3+W10hz8AlinMjHtgk
HGz6z9sCQjMvj2F57E25fCQ1RxwfP4AiNtfnrOzsgfk0x3kmeRUi5FsFkVuS+AXv
nUOkA6ptSdSGz0PEamwh+6XzIeAEhBv/LZdy9RyXOkw=
-----END EC PRIVATE KEY-----`

// aqui vc tem q informar a senha (se houver) da chave privada
var { prvKeyHex } = KEYUTIL.getKey(privateKeyPEM, 'wisekey'); 

// Setado aqui para fins de teste. 
var fcn = 'SetURI';
var args = ["NFT-Teste","http://carbon21.org/nftAtualizado"];

const EC = elliptic.ec;
const ecdsaCurve = elliptic.curves['p256'];
const ecdsa = new EC(ecdsaCurve);
const signKey = ecdsa.keyFromPrivate(prvKeyHex, 'hex');
console.log("signKey key is: ", signKey);

//
// Config init
//
var client = Client.loadFromConfig('network_org1.yaml');
var targets1 = client.getPeersForOrg('CarbonMSP');
var targets2 = client.getPeersForOrg('UsersMSP');
var targets3 = client.getPeersForOrg('IbamaMSP');
var targets4 = client.getPeersForOrg('CetesbMSP');

//
// Helper function
//
function _preventMalleability(sig) {
	const halfOrder = elliptic.curves.p256.n.shrn(1);
	if (sig.s.cmp(halfOrder) === 1) {
		const bigNum = elliptic.curves.p256.n;
		sig.s = bigNum.sub(sig.s);
	}
	return sig;
}

// 
// Main
// 
client.initCredentialStores()
.then((nothing) => {

channel = client.getChannel(config.CHANNEL_NAME);

// 1. Generate unsigned transaction proposal
var transaction_proposal = {
  chaincodeId: config.CHAINCODE_NAME,
  channelId: config.CHANNEL_NAME,
  fcn: fcn,
  args: args,
};

// var { proposal, tx_id } = channel.generateUnsignedProposal(transaction_proposal, 'CarbonMSP', cert);
var { proposal, tx_id } = channel.generateUnsignedProposal(transaction_proposal, 'CarbonMSP', certPem);
// 2. Hash the transaction proposal
var proposalBytes = proposal.toBuffer();
var digest = client.getCryptoSuite().hash(proposalBytes);
 
// 3. Calculate the signature for this transacton proposal
console.log("digest: "+digest);   
console.log("signKey: ");
// console.log(util.inspect(signKey));
var sig = ecdsa.sign(Buffer.from(digest, 'hex'), signKey);
sig = _preventMalleability(sig);
var signature = Buffer.from(sig.toDER());
var signedProposal = {
  signature,
  proposal_bytes: proposalBytes,
};

// 4. Send the signed transaction proposal
var proposal_request = {
  signedProposal: signedProposal,
  // Ele está enviando para todos, porém ao receber a primeira resposta já encaminha para o orderer.
  // Soluções possíveis: mudar a politica de endosso pra Any ou fazer ele agrupar mais endossos antes de enviar.
  // Fui pelo mais fácil e mudei a política de endosso para Any, e funcionou. 
  targets: targets1, targets2, targets3, targets4
}
console.log('Proposal request:');
console.log(util.inspect(proposal_request))
var proposalResponses = null;
var transaction_request = null;
channel.sendSignedProposal(proposal_request)
.then((responses) => {
    proposalResponses = responses;
    console.log('Proposal responses:');
    console.log(util.inspect(proposalResponses));

    // 5. Generate unsigned transaction
    transaction_request = {
      proposalResponses: proposalResponses,
      proposal: proposal,
    };
    var commitProposal = channel.generateUnsignedTransaction(transaction_request);
    return commitProposal;
})  
.then((commitProposal) => {

    // 6. Sign the unsigned transaction
    console.log('commitProposal:');
    console.log(util.inspect(commitProposal));
    var transactionBytes = commitProposal.toBuffer();
    var transaction_digest = client.getCryptoSuite().hash(transactionBytes);
    var transaction_sig = ecdsa.sign(Buffer.from(transaction_digest, 'hex'), signKey);        
    transaction_sig = _preventMalleability(transaction_sig);
    var transaction_signature = Buffer.from(transaction_sig.toDER());

    var signedTransactionProposal = {
      signature: transaction_signature,
      proposal_bytes: transactionBytes,
    };

    var signedTransaction = {
      signedProposal: signedTransactionProposal,
      request: transaction_request,
    }

    console.log('Transaction request sent to the orderer:');
    console.log(util.inspect(signedTransaction));
    
    // 7. Commit the signed transaction
    return channel.sendSignedTransaction(signedTransaction);
})
.then((response) => {
    console.log('Successfully sent transaction');
    console.log('Return code: '+response.status);
});

});
