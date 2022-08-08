var postMethods = ["Login", "Signup", "MintFT", "MintNFT", "TransferFrom"];
var getMethods = ["ClientAccountBalance", "BalanceOf"];

/**
 * Sends Request to the server. Returns the server's response
 * @param {*} method POST or GET
 * @param {*} url URL of the server
 * @param {*} body Body to be sent to the server in case of POST
 * @param {*} token Bearer token for authorization
 * @returns Response of the server
 */
async function sendToServer(method, url, body, token) {
  event.preventDefault();
  var headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (token != null) headers.append("Authorization", "Bearer " + token);

  var init = {
    method: method,
    headers: headers,
  };

  if (method == "POST") init.body = JSON.stringify(body);

  let response = await fetch(url, init);

  if (response.ok) {
    let json = await response.json();
    return json;
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }
}

/**
 * Wraps data received on the web page and returns url, request body and authorization token
 * @param {*} requestType Type of service requested to the server
 * @returns [URL, Request Body, Token]
 */
function wrapRequest(requestType) {
  event.preventDefault();
  let url;
  let token;
  let username;
  let nftId;

  console.log("request type:", requestType);

  switch (requestType) {
    case "Login":
      url = "login";
      username = document.getElementById("username").value;
      let password = document.getElementById("password").value;
      body = {
        username: username,
        password: password,
      };
      return [url, body, null];

    case "MintFT":
      url = "chaincode/channels/mychannel/chaincodes/erc1155";
      username = document.getElementById("username").value;
      qty = document.getElementById("qty").value;
      token = localStorage.getItem("token");

      body = {
        fcn: "Mint",
        args: [username, "$ylvas", qty],
      };
      return [url, body, token];

    case "MintNFT":
      url = "chaincode/channels/mychannel/chaincodes/erc1155";
      let fcn = "Mint"; // Switch to MintNFT when it's fully functional
      //let username = document.getElementById("username").value (not necessary since it will be recovered through JWT)
      nftId = document.getElementById("nftId").value;
      let phyto = document.getElementById("phyto").value;
      let location = document.getElementById("location").value;
      let amount = document.getElementById("amount").value;
      token = document.getElementById("token").value;

      meta = {
        nftId: nftId,
        phyto: phyto,
        location: location,
      };

      body = {
        fcn: fcn,
        args: ["", nftId, amount, JSON.stringify(meta)],
      };
      return [url, body, token];

    case "ClientAccountBalance":
      nftId = document.getElementById("nftId").value;
      url = `chaincode/channels/mychannel/chaincodes/erc1155?fcn=ClientAccountBalance&args=[\"${nftId}\"]`;
      token = document.getElementById("token").value;
      return [url, null, token];

    case "ClientAccountTotalBalance":
      url = `chaincode/channels/mychannel/chaincodes/erc1155?fcn=ClientAccountTotalBalance&args=[""]`;
      token = document.getElementById("token").value;
      return [url, null, token];

    case "BalanceOf":
      username = localStorage.getItem("username");
      url = `chaincode/channels/mychannel/chaincodes/erc1155?fcn=BalanceOf&args=[\"${username}\",\"$ylvas\"]`;
      token = localStorage.getItem("token");
      return [url, null, token];

    case "TransferFrom":
      url = "chaincode/channels/mychannel/chaincodes/erc1155";
      usernameSource = document.getElementById("usernameSource").value;
      usernameDest = document.getElementById("usernameDest").value;
      tokenId = document.getElementById("tokenId").value;
      qty = document.getElementById("qty").value;
      token = localStorage.getItem("token");

      body = {
        fcn: "TransferFrom",
        args: [usernameSource, usernameDest, tokenId, qty],
      };
      return [url, body, token];

    default:
      console.log("None");
  }
}

/**
 * Main function, which receives input from the web page, wraps it into HTTP request components 
 * (calling wrapRequest()) and sends it to the server (calling sendToServer())
 * @param {*} requestType Server requested to the server
 */
async function sendRequest(requestType) {
  event.preventDefault();
  let [url, body, token] = wrapRequest(requestType);
  let response;

  // Request sending
  if (postMethods.includes(requestType)) response = await sendToServer("POST", url, body, token);
  else response = await sendToServer("GET", url, body, token);

  console.log("response = ", response);

  // Response handling
  switch (requestType) {
    case "Login":
      localStorage.setItem("token", response.token); // store token in local storage
      localStorage.setItem("username", document.getElementById("username").value);
      if (response.success) {
        alert("Logado com Sucesso!");
        window.location.href = '/wallet';
      } else {
        alert("Falha no login.");
      }
      break;

    case "MintFT":
      if (response.result == null) alert("Mint Falhou");
      else {
        document.getElementById("submitButton").style.display = "flex";
        document.getElementById("loader").style.display = "none";
        alert("Mint de FTs realizado com sucesso");
      }
      break;

    case "MintNFT":
      if (response.result == null) alert("Mint Falhou");
      else {
        document.getElementById("submitButton").style.display = "flex";
        document.getElementById("loader").style.display = "none";
        alert("Mint de NFTs realizado com sucesso");
      }
      break;
      
    case "ClientAccountBalance":
      if (response.result.ClientAccountBalance == null) alert("Id não encontrado");
      else balanceHeader.innerText = response.result.ClientAccountBalance + " Sylvas";
      break;

    case "ClientAccountTotalBalance":
      if (response.result.message == "NO_TOKENS") alert("Erro: Não foram identificados NFTs");
      else if (response.result.message == "success") {
        let balances = response.result.balances;
        let element;
        //element = '<div class="d-flex flex-column justify-content-between p-md-1">'
        //for (var i = 0; i < Object.keys(response.result.balances).length; i++) {
        for (var key in balances) {
          element += 
          '<div class="card shadow-lg">' +
            '<div class="card-body flex-column">' +
              '<div class="d-flex justify-content-between p-md-1">' +
                  '<div class="d-flex flex-row">' +
                    '<div class="align-self-center">' +
                      '<i class="fa-solid fa-tree fa-4x tree-icon"></i>' +
                    '</div>' +
                    '<div>' +
                      '<h4>NFT</h4>' +
                      `<p class="mb-0">id: ${key}</p>` +
                      `<p class="mb-0">valor: ${balances[key]}</p>` +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
              
        }
        document.getElementById("nft-showroom").innerHTML = element;
      }

      break;

    case "BalanceOf":
      if (response.result == null) alert("Falha de sincronização");
      else {
        document.getElementById("submitButton").style.display = "block";
        document.getElementById("loader").style.display = "none";
        balanceHeader.innerText = response.result + " Sylvas";
      }
      break;
    case "TransferFrom":
      if (response.result == null) alert("Transferência Falhou");
      else {
        document.getElementById("submitButton").style.display = "flex";
        document.getElementById("loader").style.display = "none";
        alert("Transferência realizada com sucesso");
      }
  }
}
