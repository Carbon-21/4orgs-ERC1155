async function transfer() {
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
  let url = "http://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/transfer";

  var init = {
    method: "POST",
    headers: headers,
  };

  body = {
    tokenId,
    tokenAmount: qty,
    tokenSender: usernameSource,
    tokenReceiver: usernameDest,
  };

  init.body = JSON.stringify(body);

  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();
    if (response.result == null) alert("Transferência Falhou");
    else {
      document.getElementById("submitButton").style.display = "flex";
      document.getElementById("loader").style.display = "none";
      alert("Transferência realizada com sucesso");
    }
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }
}
