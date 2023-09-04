// Calls the API for the smart contract function that mints FT for every active NFT

window.requestNFT = async () => {
  event.preventDefault();
  console.log("entrou aqui aaaaaaaaaaaaaaaaaaa");

  // Hides the submit button and displays loading image while the transaction is processing.

  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitButton").style.display = "none";

  console.log(document.getElementById("landOwner").value);
  console.log(document.getElementById("phyto").value);
  console.log(document.getElementById("landArea").value);
  console.log(document.getElementById("geolocation").value);
  console.log(document.getElementById("userNotes").value);
  // console.log(document.getElementById("file").value);

  landOwner = document.getElementById("landOwner").value;
  phyto = document.getElementById("phyto").value;
  landArea = document.getElementById("landArea").value;
  geolocation = document.getElementById("geolocation").value;
  userNotes = document.getElementById("userNotes").value;
  // file = document.getElementById("file").value;

  // Get user jwt token from the local storage
  let token = localStorage.getItem("token");
  console.log("token", token);

  // HTTP Request
  let headers = new Headers();
  headers.append("Content-Type", "multipart/form-data");
  headers.append("Authorization", "Bearer " + token);
  // const headers = { 'Authorization': "Bearer " + token, "Content-Type": "multipart/form-data"}

  let url = `https://${HOST}:${PORT}/nft/requests`;
  console.log("url", url);

  var body = {
    landOwner, 
    phyto,
    landArea,
    geolocation,
    userNotes,
    userId: 1
  };
  console.log("body", body)

  var init = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body)
  };

  console.log(init);
  console.log(init.headers);

  let response = await fetch(url, init);
  console.log("response", response);

  // if (response.ok) {
  //   response = await response.json();
  //   if (response.result!="success") {

  //     // Hides the loading image and displays the submit button again
  //     document.getElementById("submitButton").style.display = "flex";
  //     document.getElementById("loader").style.display = "none";

  //     // Displays error messages
  //     let element =     
  //     `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
  //         `Ocorreu um erro na emissao`+
  //         `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
  //     `</div>`
  //     document.getElementById("flash").innerHTML = element;
  //   } else {

  //     // Hides the loading image and displays the submit button again
  //     document.getElementById("submitButton").style.display = "flex";
  //     document.getElementById("loader").style.display = "none";
      
  //     // Displays success messages
  //     let element =     
  //       `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">`+
  //           `$ylvas emitidos com sucesso`+
  //           `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
  //       `</div>`
  //     document.getElementById("flash").innerHTML = element;
  //   }
  // } else {

  //   // Hides the loading image and displays the submit button again
  //   document.getElementById("submitButton").style.display = "flex";
  //   document.getElementById("loader").style.display = "none";

  //   console.log("HTTP Error ", response.status);
  //   // Displays error messages
  //   let element =     
  //   `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
  //       `Ocorreu um erro na emissao`+
  //       `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
  //   `</div>`
  //   document.getElementById("flash").innerHTML = element;
  //   return null;
  // }
}