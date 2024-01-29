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

    // Step 1: Endorse
    // 1.1 Generate unsigned transaction proposal

    const certPem = '<PEM encoded certificate content>';
    const mspId = 'Org1MSP'; // the msp Id for this org

    const transactionProposal = {
        fcn: 'move',
        args: ['a', 'b', '100'],
        chaincodeId: 'mychaincodeId',
        channelId: 'mychannel',
    };
    const { proposal, txId } = channel.generateUnsignedProposal(transactionProposal, mspId, certPem);
    // now we have the 'unsigned proposal' for this transaction

    // 1.2 Calculate the hash

    const proposalBytes = proposal.toBuffer(); // the proposal comes from step 1
    const hashFunction = xxxx; // A hash function by the user's desire
    const digest = hashFunction(proposalBytes); // calculate the hash of the proposal bytes

    // 1.3 Calculate the signature
    // This is a sample code for signing the digest from step 2 with EC.
    // Different signature algorithm may have different interfaces

    const elliptic = require('elliptic');
    const { KEYUTIL } = require('jsrsasign');

    const privateKeyPEM = '<The PEM encoded private key>';
    const { prvKeyHex } = KEYUTIL.getKey(privateKeyPEM); // convert the pem encoded key to hex encoded private key

    const EC = elliptic.ec;
    const ecdsaCurve = elliptic.curves['p256'];

    const ecdsa = new EC(ecdsaCurve);
    const signKey = ecdsa.keyFromPrivate(prvKeyHex, 'hex');
    const sig = ecdsa.sign(Buffer.from(digest, 'hex'), signKey);

    // now we have the signature, next we should send the signed transaction proposal to the peer
    const signature = Buffer.from(sig.toDER());
    const signedProposal = {
        signature,
        proposal_bytes: proposalBytes,
    };

    // 1.4 Send the signed transaction proposal

    const sendSignedProposalReq = { signedProposal, targets };
    const proposalResponses = await channel.sendSignedProposal(sendSignedProposalReq);
    // check the proposal responses, if all good, commit the transaction

    // 2 Commit
    // 2.1 Generate an unsigned transaction 
    const commitReq = {
        proposalResponses,
        proposal,
    };
    
    const commitProposal = await channel.generateUnsignedTransaction(commitReq);
    
    // 2.2 Sign the unsigned transaction with the user's private key
    const signedCommitProposal = signProposal(commitProposal);

    // 2.3 Commit the signed transaction
    const response = await channel.sendSignedTransaction({
        signedProposal: signedCommitProposal,
        request: commitReq,
    });
    
    // response.status should be 'SUCCESS' if the commit succeed
    
    // 3 Register Channel Event Listerner: If the channel event hub has not connected to the peer, the channel eventhub registration needs the private key's signature too. 
    // 3.1 Generate an unsigned eventhub registration
    const unsignedEvent = eh.generateUnsignedRegistration({
        certificate: certPem,
        mspId,
    });

    // 3.2 Sign the unsigned eventhub registration
    const signedProposal = signProposal(unsignedEvent);
    const signedEvent = {
        signature: signedProposal.signature,
        payload: signedProposal.proposal_bytes,
    };

    // 3.3 Register this ChannelEventHub at peer
    channelEventHub.connect({signedEvent});
}