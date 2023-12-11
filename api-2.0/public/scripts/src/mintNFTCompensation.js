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

const mintNFTCompensation = async () => {
     event.preventDefault();

    // Hides the submit button and displays loading image while the transaction is processing.
    document.getElementById("loader").style.display = "flex";
    document.getElementById("submitButton").style.display = "none";

    let token = localStorage.getItem("token");

  // HTTP Request
  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + token);
  let url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/mintnftcompensation`;

  var init = {
    method: "POST",
    headers: headers,
  };

  var body = {
    idNFTTerra: document.getElementById("idNFTTerra").value,
    compensationTotalArea: document.getElementById("compensationTotalArea").value,
    tokenReceiver: document.getElementById("compensationOwner").value
  };

  init.body = JSON.stringify(body);

  let response = await fetch(url, init);
  let responseJson = await response.json();
  document.getElementById("loader").style.display = "none";
  document.getElementById("submitButton").style.display = "flex";
  if (!response.ok || responseJson.result == null) {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    return null;
  } else {
    document.getElementById("flash").innerHTML = successFlashMessage;
  }

  
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
              `C21 emitidos com sucesso`+
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