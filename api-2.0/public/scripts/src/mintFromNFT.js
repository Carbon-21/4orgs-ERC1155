// Calls the API for the smart contract function that mints FT for every active NFT

const mintFTFromNFT = async () => {

    // Hides the submit button and displays loading image while the transaction is processing.

    document.getElementById("loader").style.display = "flex";
    document.getElementById("submitButton").style.display = "none";
  
    // Get user jwt token from the local storage
    let token = localStorage.getItem("token");

    // HTTP Request
    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + token);
    let url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/ftfromnft`;
  
    var init = {
      method: "POST",
      headers: headers,
    };
  
    var body = {};
  
    init.body = JSON.stringify(body);
  
    let response = await fetch(url, init);
  
    if (response.ok) {
      response = await response.json();
      if (response.result!="success") {

        // Hides the loading image and displays the submit button again
        document.getElementById("submitButton").style.display = "flex";
        document.getElementById("loader").style.display = "none";

        // Displays error messages
        let element =     
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
            `Ocorreu um erro na emissao`+
            `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
        `</div>`
        document.getElementById("flash").innerHTML = element;
      } else {

        // Hides the loading image and displays the submit button again
        document.getElementById("submitButton").style.display = "flex";
        document.getElementById("loader").style.display = "none";
        
        // Displays success messages
        let element =     
          `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">`+
              `$ylvas emitidos com sucesso`+
              `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
          `</div>`
        document.getElementById("flash").innerHTML = element;
      }
    } else {

      // Hides the loading image and displays the submit button again
      document.getElementById("submitButton").style.display = "flex";
      document.getElementById("loader").style.display = "none";

      console.log("HTTP Error ", response.status);
      // Displays error messages
      let element =     
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
          `Ocorreu um erro na emissao`+
          `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
      `</div>`
      document.getElementById("flash").innerHTML = element;
      return null;
    }
  }