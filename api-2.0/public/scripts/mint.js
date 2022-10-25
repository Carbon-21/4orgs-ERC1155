const client = require("./transaction-handler");


window.addEventListener("load", () => {
  const keyOnServer = localStorage.getItem("keyOnServer");
  const signingFilesElement = document.getElementById("signing-files");

  // Renders uploading crypto files element conditionally, depending on the value of keyOnServer
  signingFilesElement.hidden = (keyOnServer == "true") ? true : false;
});

window.mintFT = async () => {
  const keyOnServer = localStorage.getItem("keyOnServer");
  if (keyOnServer == "true") mintFTServerSideSigning();
  else mintFTClientSideSigning();
}

const mintFTClientSideSigning = async () => {
  if (localStorage.getItem("keyOnServer") == "false") {
      event.preventDefault();

      let username = document.getElementById("username").value;
      let qty = document.getElementById("qty").value;

      // Temporary way to get ClientAccountId while we don't know how to get it without needing the client's private key to access the Chaincode
      let clientAccountId = `x509::CN=${username},OU=client+OU=carbon+OU=department1::CN=fabric-ca-server,OU=Fabric,O=Hyperledger,ST=North Carolina,C=US`;

      clientAccountId = window.btoa(clientAccountId);

      const transaction = {
          chaincodeId: 'erc1155',
          channelId: 'mychannel',
          fcn: "Mint",
          args: [clientAccountId, "$ylvas", qty]
      };

      await client.offlineTransaction(transaction);
  }
}

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
    let url = "http://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/mint";

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

    if (response.ok) {
        response = await response.json();
        if (response.result!="success") {
          document.getElementById("submitButton").style.display = "flex";
          document.getElementById("loader").style.display = "none";
          let element =     
          `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
              `Ocorreu um erro na emissao`+
              `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
          `</div>`
          document.getElementById("flash").innerHTML = element;
        } else {
          document.getElementById("submitButton").style.display = "flex";
          document.getElementById("loader").style.display = "none";
          let element =     
            `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">`+
                `$ylvas emitidos com sucesso`+
                `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
            `</div>`
          document.getElementById("flash").innerHTML = element;
        }
    } else {
      console.log("HTTP Error ", response.status);
      document.getElementById("submitButton").style.display = "flex";
      document.getElementById("loader").style.display = "none";
      let element =     
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
          `Ocorreu um erro na emissao`+
          `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
      `</div>`
      document.getElementById("flash").innerHTML = element;
      return null;
    }

}

async function mintNFT(){

    event.preventDefault();

    document.getElementById("loader").style.display = "flex";
    document.getElementById("submitButton").style.display = "none";

    let username = document.getElementById("username").value;
    let nftId = document.getElementById("nftId").value
    let phyto = document.getElementById("phyto").value
    let location = document.getElementById("location").value
    let qty = document.getElementById("amount").value

    let token = localStorage.getItem("token");

    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + token)
    let url = "http://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/mint";

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

    if (response.ok) {
        response = await response.json();
        if (response.result==null) {
          document.getElementById("submitButton").style.display = "flex";
          document.getElementById("loader").style.display = "none";
          let element =     
          `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
              `Ocorreu um erro na emissao`+
              `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
          `</div>`
          document.getElementById("flash").innerHTML = element;
        } else {
          document.getElementById("submitButton").style.display = "flex";
          document.getElementById("loader").style.display = "none";
          let element =     
            `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">`+
                `NFT emitido com sucesso`+
                `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
            `</div>`
          document.getElementById("flash").innerHTML = element;
        }
    } else {

      console.log("HTTP Error ", response.status);
      document.getElementById("submitButton").style.display = "flex";
      document.getElementById("loader").style.display = "none";
      let element =     
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
          `Ocorreu um erro na emissao`+
          `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
      `</div>`
      document.getElementById("flash").innerHTML = element;
      return null;
    }

}