async function mintFT(){

    event.preventDefault();

    document.getElementById("loader").style.display = "flex";
    document.getElementById("submitButton").style.display = "none";

    let username = document.getElementById("username").value;
    let qty = document.getElementById("qty").value;

    let host = document.getElementById("host").value
    let port = document.getElementById("port").value

    let token = localStorage.getItem("token");

    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + token)
    let url = `http://${host}:${port}/invoke/channels/mychannel/chaincodes/erc1155/mint`;

    var init = {
        method: "POST",
        headers: headers,
    };

      body = {
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
          element =     
          `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
              `Ocorreu um erro na emissao`+
              `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
          `</div>`
          document.getElementById("flash").innerHTML = element;
        } else {
          document.getElementById("submitButton").style.display = "flex";
          document.getElementById("loader").style.display = "none";
          element =     
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
      element =     
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

    let host = document.getElementById("host").value
    let port = document.getElementById("port").value

    let token = localStorage.getItem("token");

    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + token)
    let url = `http://${host}:${port}/invoke/channels/mychannel/chaincodes/erc1155/mint`;

    var init = {
        method: "POST",
        headers: headers,
    };

      body = {
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
          element =     
          `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
              `Ocorreu um erro na emissao`+
              `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
          `</div>`
          document.getElementById("flash").innerHTML = element;
        } else {
          document.getElementById("submitButton").style.display = "flex";
          document.getElementById("loader").style.display = "none";
          element =     
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
      element =     
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
          `Ocorreu um erro na emissao`+
          `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
      `</div>`
      document.getElementById("flash").innerHTML = element;
      return null;
    }

}