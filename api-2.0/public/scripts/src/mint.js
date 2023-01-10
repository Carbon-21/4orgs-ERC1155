const client = require("./transaction-handler");

// Flash messages that are displayed to the user in case of success or failure of the transaction execution
const successFlashMessage =
  `<div  id="flash-message" class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Transação realizada com sucesso` +
  `<button id="flash-button" type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

const failureFlashMessage =
  `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Ocorreu um erro na execução da transação` +
  `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

/**
 * Calls Server or Client-Side Signing Mint functions depending on where the user chose
 * to store his Private Key (on his computer or on the server).
 */
window.mintFT = async () => {
  const keyOnServer = localStorage.getItem("keyOnServer");
  if (keyOnServer == "true") mintFTServerSideSigning();
  else mintFTClientSideSigning();
};

window.mintNFT = async () => {
  const keyOnServer = localStorage.getItem("keyOnServer");
  if (keyOnServer == "true") mintNFTServerSideSigning();
  else mintNFTClientSideSigning();
};

/**
 * Executes "Mint" transaction in Client-Side Signing Mode.
 */
const mintFTClientSideSigning = async () => {
  if (localStorage.getItem("keyOnServer") == "false") {
    // Hides the file upload fields and displays loading image while the transaction is processing.
    document.getElementById("signing-files").style.display = "none";
    document.getElementById("submitButton").style.display = "none";
    document.getElementById("loader").style.display = "flex";
    document.getElementById("flash-button")?.click();
    event.preventDefault();

    let username = document.getElementById("username").value;
    let qty = document.getElementById("qty").value;

    // Temporary way to get ClientAccountId while we don't know how to get it without needing the client's private key to access the Chaincode
    let clientAccountId = `x509::CN=${username},OU=client+OU=carbon+OU=department1::CN=fabric-ca-server,OU=Fabric,O=Hyperledger,ST=North Carolina,C=US`;

    // Base-64 encoding of clientAccountId
    clientAccountId = window.btoa(clientAccountId);

    const transaction = {
      chaincodeId: "erc1155",
      channelId: "mychannel",
      fcn: "Mint",
      args: [clientAccountId, "$ylvas", qty],
    };

    try {
      // Executes the transaction in Client-Side Signing Mode
      let response = await client.offlineTransaction(transaction);

      // Hides the loading image and displays the file upload fields again
      document.getElementById("signing-files").style.display = "block";
      document.getElementById("submitButton").style.display = "block";
      document.getElementById("loader").style.display = "none";

      // Displays Flash Messages
      if (response.result == "SUCCESS") {
        document.getElementById("flash").innerHTML = successFlashMessage;
      } else {
        document.getElementById("flash").innerHTML = failureFlashMessage;
      }
    } catch (e) {
      document.getElementById("flash").innerHTML = failureFlashMessage;
      console.log("Error:", e.message);
    }
  }
};

/**
 * Executes "Mint" transaction in Server-Side Signing Mode.
 */
const mintFTServerSideSigning = async () => {
  event.preventDefault();

  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitButton").style.display = "none";

  let username = document.getElementById("username").value;
  let qty = document.getElementById("qty").value;

  let token = localStorage.getItem("token");

  let headers = new Headers();
  headers.append("Content-Type", "application/json");

  headers.append("Authorization", "Bearer " + token)
  let url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/mint`;


  var init = {
    method: "POST",
    headers: headers,
  };

  var body = {
    tokenId: "$ylvas",
    tokenAmount: qty,
    tokenReceiver: username,
  };

  init.body = JSON.stringify(body);

  let response = await fetch(url, init);

  document.getElementById("submitButton").style.display = "flex";
  document.getElementById("loader").style.display = "none";

  if (response.ok) {
    response = await response.json();
    if (response.result != "success") {
      document.getElementById("flash").innerHTML = failureFlashMessage;
    } else {
      document.getElementById("flash").innerHTML = successFlashMessage;
    }
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    return null;
  }
};

/**
 * Executes "Mint" transaction in Client-Side Signing Mode.
 */
const mintNFTClientSideSigning = async () => {
  if (localStorage.getItem("keyOnServer") == "false") {
    // Hides the file upload fields and displays loading image while the transaction is processing.
    document.getElementById("signing-files").style.display = "none";
    document.getElementById("submitButton").style.display = "none";
    document.getElementById("loader").style.display = "flex";
    document.getElementById("flash-button")?.click();

    event.preventDefault();

    let username = document.getElementById("username").value;
    let nftId = document.getElementById("nftId").value;
    let qty = 1;
    //let phyto = document.getElementById("phyto").value;
    //let location = document.getElementById("location").value;

    // Temporary way to get ClientAccountId while we don't know how to get it without needing the client's private key to access the Chaincode
    let clientAccountId = `x509::CN=${username},OU=client+OU=carbon+OU=department1::CN=fabric-ca-server,OU=Fabric,O=Hyperledger,ST=North Carolina,C=US`;

    // Base-64 encoding of clientAccountId
    clientAccountId = window.btoa(clientAccountId);

    const transaction = {
      chaincodeId: "erc1155",
      channelId: "mychannel",
      fcn: "Mint",
      args: [clientAccountId, nftId, qty],
    };

    try {
      // Executes the transaction in Client-Side Signing Mode
      let response = await client.offlineTransaction(transaction);

      // Hides the loading image and displays the file upload fields again
      document.getElementById("signing-files").style.display = "block";
      document.getElementById("submitButton").style.display = "block";
      document.getElementById("loader").style.display = "none";

      // Displays Flash Messages
      if (response.result == "SUCCESS") {
        document.getElementById("flash").innerHTML = successFlashMessage;
      } else {
        document.getElementById("flash").innerHTML = failureFlashMessage;
      }
    } catch (e) {
      document.getElementById("flash").innerHTML = failureFlashMessage;
      console.log("Error:", e.message);
    }
  }
};

/**
 * Executes "Mint" transaction in Server-Side Signing Mode.
 */
const mintNFTServerSideSigning = async () => {
  event.preventDefault();

  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitButton").style.display = "none";

  let username = document.getElementById("username").value;
  let nftId = document.getElementById("nftId").value;
  let qty = 1;
  let token = localStorage.getItem("token");

  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + token)
  let url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/mint`;


  var init = {
    method: "POST",
    headers: headers,
  };

  var body = {
    tokenId: nftId,
    tokenAmount: qty,
    tokenReceiver: username,
  };

  init.body = JSON.stringify(body);

  let response = await fetch(url, init);
  let responseJson = await response.json();
  if (!response.ok || responseJson.result == null) {
    document.getElementById("submitButton").style.display = "flex";
    document.getElementById("loader").style.display = "none";
    document.getElementById("flash").innerHTML = failureFlashMessage;
    return null;
  }

  // Post metadata through ipfs node
  let metadata = {
    id: nftId,
    status: `Ativo`,
    amount: qty,
    land_owner: document.getElementById("landOwner").value,
    land: document.getElementById("area").value,
    phyto: document.getElementById("phyto").value,
    geolocation: document.getElementById("location").value,
    compensation_owner: document.getElementById("compensationOwner").value,
    compensation_state: "Não Compensado",
  };

  let postMetadataURL = `https://${HOST}:${PORT}/meta/postMetadata`;
  init.body = JSON.stringify({
    metadata,
    tokenId: nftId,
  });
  let metadataResponse = await fetch(postMetadataURL, init);
  let metadataResponseJson = await metadataResponse.json();

  document.getElementById("submitButton").style.display = "flex";
  document.getElementById("loader").style.display = "none";

  if (!metadataResponse.ok || metadataResponseJson.result == null) {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    return null;
  }

  document.getElementById("flash").innerHTML = successFlashMessage;
};
