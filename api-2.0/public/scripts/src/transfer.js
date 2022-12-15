const client = require("./transaction-handler");

// Flash messages that are displayed to the user in case of success or failure of the transaction execution
const successFlashMessage =     
    `<div  id="flash-message" class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">`+
        `Transação realizada com sucesso`+
        `<button id="flash-button" type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
    `</div>`;

const failureFlashMessage =     
    `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
        `Ocorreu um erro na execução da transação`+
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
    `</div>`

/**
 * Calls Server or Client-Side Signing Mint functions depending on where the user chose
 * to store his Private Key (on his computer or on the server).
 */
 window.transfer = async () => {
  const keyOnServer = localStorage.getItem("keyOnServer");
  if (keyOnServer == "true") transferServerSideSigning();
  else transferClientSideSigning();
}

/**
 * Executes "Transfer" transaction in Client-Side Signing Mode.
 */
 const transferClientSideSigning = async () => {
  if (localStorage.getItem("keyOnServer") === "false") {
    // Hides the file upload fields and displays loading image while the transaction is processing.
    document.getElementById("signing-files").style.display = "none";
    document.getElementById("submitButton").style.display = "none";
    document.getElementById("loader").style.display = "flex";
    document.getElementById("flash-button")?.click();
    event.preventDefault();
    
    let usernameSource = localStorage.getItem("username");
    
    let usernameDest = document.getElementById("usernameDest").value;
    let tokenId = document.getElementById("tokenId").value;
    let qty = document.getElementById("qty").value;
    let token = localStorage.getItem("token");
    
    // Temporary way to get ClientAccountId while we don't know how to get it without needing the client's private key to access the Chaincode
    let receiverAccountId = `x509::CN=${usernameDest},OU=client+OU=carbon+OU=department1::CN=fabric-ca-server,OU=Fabric,O=Hyperledger,ST=North Carolina,C=US`;
    let senderAccountId = `x509::CN=${usernameSource},OU=client+OU=carbon+OU=department1::CN=fabric-ca-server,OU=Fabric,O=Hyperledger,ST=North Carolina,C=US`;
    
    // Base-64 encoding of clientAccountId
    receiverAccountId = window.btoa(receiverAccountId);
    senderAccountId = window.btoa(senderAccountId);
    
    const transaction = {
      chaincodeId: 'erc1155',
      channelId: 'mychannel',
      fcn: "TransferFrom",
      args: [senderAccountId, receiverAccountId, tokenId, qty]
    };
    
    try {
      // Verify if the user is registered
      let headers = new Headers();
      headers.append("Authorization", "Bearer " + token);
      let url = `https://${HOST}:${PORT}/query/channels/mychannel/chaincodes/erc1155/isUserRegistered?username=${usernameDest}&org=Carbon`;
    
      var init = {
        method: "GET",
        headers: headers,
      };
    
      let isUserRegisteredResponse = await fetch(url, init);
      let isUserRegistered = (await isUserRegisteredResponse.json())?.result;
      if (!isUserRegisteredResponse.ok || !isUserRegistered) {
        document.getElementById("signing-files").style.display = "block";
        document.getElementById("submitButton").style.display = "block";
        document.getElementById("loader").style.display = "none";
        document.getElementById("flash").innerHTML = failureFlashMessage;
        return null;
      }


      // Executes the transaction in Client-Side Signing Mode
      let transactionResponse = await client.offlineTransaction(transaction);
      
      // Hides the loading image and displays the file upload fields again
      document.getElementById("signing-files").style.display = "block";
      document.getElementById("submitButton").style.display = "block";
      document.getElementById("loader").style.display = "none";
        
        // Displays Flash Messages
        if (transactionResponse.result == "SUCCESS") {
            document.getElementById("flash").innerHTML = successFlashMessage;
        } else {
            document.getElementById("flash").innerHTML = failureFlashMessage;
        }
      } catch (e) {
        document.getElementById("flash").innerHTML = failureFlashMessage;
      }

  }
}

/**
 * Executes "Transfer" transaction in Server-Side Signing Mode.
 */
const transferServerSideSigning = async () => {
  event.preventDefault();

  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitButton").style.display = "none";

  let usernameDest = document.getElementById("usernameDest").value;
  let tokenId = document.getElementById("tokenId").value;
  let qty = document.getElementById("qty").value;

  let token = localStorage.getItem("token");
  let usernameSource = localStorage.getItem("username");

  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + token);
  let url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/transfer`;

  var init = {
    method: "POST",
    headers: headers,
  };

  let body = {
    tokenId,
    tokenAmount: qty,
    tokenSender: usernameSource,
    tokenReceiver: usernameDest,
  };

  init.body = JSON.stringify(body);

  let response = await fetch(url, init);

  let element;
  if (response.ok) {
    response = await response.json();
    if (response.result == null){
      document.getElementById("submitButton").style.display = "flex";
      document.getElementById("loader").style.display = "none";
      element = failureFlashMessage;
      document.getElementById("flash").innerHTML = element;
    }
    else {
      document.getElementById("submitButton").style.display = "flex";
      document.getElementById("loader").style.display = "none";
      element = successFlashMessage;
    document.getElementById("flash").innerHTML = element;
    }
  } else {
    document.getElementById("submitButton").style.display = "flex";
    document.getElementById("loader").style.display = "none";
    element = failureFlashMessage;
    document.getElementById("flash").innerHTML = element;
    return null;
  }
}
