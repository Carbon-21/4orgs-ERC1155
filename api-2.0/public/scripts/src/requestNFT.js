// Calls the API for the smart contract function that mints FT for every active NFT

window.requestNFT = async () => {
  event.preventDefault();
  
  // Hides the submit button and displays loading image while the transaction is processing.
  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitButton").style.display = "none";
  
  let landOwner = document.getElementById("landOwner").value;
  let phyto = document.getElementById("phyto").value;
  let landArea = document.getElementById("landArea").value;
  let geolocation = document.getElementById("geolocation").value;
  let userNotes = document.getElementById("userNotes").value;
  let file = document.getElementById("file").files[0];

  // Get user jwt token from the local storage
  let token = localStorage.getItem("token");
  let userId = localStorage.getItem("userId");
  let username = localStorage.getItem("username");

  // HTTP Request
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);

  let url = `https://${HOST}:${PORT}/nft/requests`;

  const formData = new FormData();

  formData.append("landOwner", landOwner);
  formData.append("landArea", landArea);
  formData.append("phyto", phyto);
  formData.append("geolocation", geolocation);
  formData.append("userNotes", userNotes);
  formData.append("userId", userId);
  formData.append("username", username);
  formData.append("file", file);

  var init = {
    method: "POST",
    headers: headers,
    body: formData
  };

  let response = await fetch(url, init);

  if (response.ok) {
    // Hides the loading image and displays the submit button again
    document.getElementById("submitButton").style.display = "flex";
    document.getElementById("loader").style.display = "none";
    
    // Displays success messages
    let element =     
      `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">`+
          `Solicitação emitida com sucesso!`+
          `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
      `</div>`
    document.getElementById("flash").innerHTML = element;
    
  } else {

    // Hides the loading image and displays the submit button again
    document.getElementById("submitButton").style.display = "flex";
    document.getElementById("loader").style.display = "none";

    console.log("HTTP Error ", response.status);
    // Displays error messages
    let element =     
    `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
        `Ocorreu um erro na solicitação`+
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
    `</div>`
    document.getElementById("flash").innerHTML = element;
    return null;
  }
}