// Calls the API for the smart contract function that mints FT for every active NFT

window.requestNFT = async () => {
  event.preventDefault();
  
  // Hides the submit button and displays loading image while the transaction is processing.
  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitButton").style.display = "none";

  landOwner = document.getElementById("landOwner").value;
  phyto = document.getElementById("phyto").value;
  landArea = document.getElementById("landArea").value;
  geolocation = document.getElementById("geolocation").value;
  userNotes = document.getElementById("userNotes").value;
  file = document.getElementById("file").files[0];

  // Get user jwt token from the local storage
  let token = localStorage.getItem("token");
  console.log("token", token);

  // HTTP Request
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);

  let url = `https://localhost:4000/nft/requests`;
  console.log("url", url);

  const formData = new FormData();

  formData.append("landOwner", landOwner);
  formData.append("landArea", landArea);
  formData.append("phyto", phyto);
  formData.append("geolocation", geolocation);
  formData.append("userNotes", userNotes);
  formData.append("userId", 1);
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