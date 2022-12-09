const client = require("./transaction-handler");

let metadata;
let metadataArray = [];

// Flash messages that are displayed to the user in case of success or failure of the transaction execution
const successCollectionFlashMessage =     
    `<div  id="flash-message" class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">`+
        `Coleção obtida com sucesso.`+
        `<button id="flash-button" type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
    `</div>`;

const failureCollectionFlashMessage =     
    `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
        `Ocorreu um erro ao obter a coleção.`+
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
    `</div>`

const successCompensationFlashMessage =     
`<div  id="flash-message" class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">`+
    `Compensado com sucesso.`+
    `<button id="flash-button" type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
`</div>`;

const failureCompensationFlashMessage =     
`<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
    `Ocorreu um erro na compensação.`+
    `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
`</div>`

/**
 * Executes "SelfBalanceNFT" transaction in Client-Side Signing Mode.
 */
 window.collectionClientSideSigning = async () => {
  if (localStorage.getItem("keyOnServer") == "false") {
    
      // Hides the file upload fields and displays loading image while the transaction is processing.
      document.getElementById("signing-files").style.display = "none";
      document.getElementById("loader").style.display = "block";
      document.getElementById("flash-button")?.click();

      event.preventDefault();
     
      try {
        // Executes the transaction in Client-Side Signing Mode
        let nftTokens = await getNftTokens();
  
        // Renderiza a tela de coleção
        await renderCollection(nftTokens);
        document.getElementById("flash").innerHTML = successCollectionFlashMessage;
      } catch (e) {
        document.getElementById("flash").innerHTML = failureCollectionFlashMessage;
        console.log("Erro: ", e.message);
      }
      document.getElementById("signing-files").style.display = "block";
      document.getElementById("loader").style.display = "none";      
  }
}

/**
 * Executes "SelfBalanceNFT" transaction in Server-Side Signing Mode.
 */
window.collectionServerSideSigning = async () => {
  if (localStorage.getItem("keyOnServer") == "true") {
    
    // Hides the file upload fields and displays loading image while the transaction is processing.
    document.getElementById("signing-files").style.display = "none";
    document.getElementById("loader").style.display = "block";
    document.getElementById("flash-button")?.click();

    event.preventDefault();
   
    try {
      // Executes the transaction in Client-Side Signing Mode
      let nftTokens = await getNftTokens();

      // Renderiza a tela de coleção
      await renderCollection(nftTokens);
      document.getElementById("flash").innerHTML = successCollectionFlashMessage;
    } catch (e) {
      document.getElementById("flash").innerHTML = failureCollectionFlashMessage;
      console.log("Error: ", e.message);
    }
    document.getElementById("signing-files").style.display = "block";
    document.getElementById("loader").style.display = "none";      
  }
}

// Recupera os nfts do usuario logado
async function getNftTokens() {
  let result;

  // gets NFT tokens in Server-side signing mode
  if (localStorage.getItem("keyOnServer") == "true") {
    let token = localStorage.getItem("token");
    let headers = new Headers();
    headers.append("Authorization", "Bearer " + token);
    let url = `http://localhost:4000/query/channels/mychannel/chaincodes/erc1155/selfBalanceNFT`;
    var init = {
      method: "GET",
      headers: headers,
    };
  
    let response = await fetch(url, init);
    result = (await response.json())?.result;
  } else {
    // gets NFT tokens in Client-side signing mode
    const transaction = {
      chaincodeId: 'erc1155',
      channelId: 'mychannel',
      fcn: "SelfBalanceNFT",
      args: []
    };
    let response = await client.offlineTransaction(transaction);
    result = await JSON.parse(response.payload);
  }
  let nftArray = [];
  // Retornar array contendo somente a lista de ids dos nfts
  for (var i in result) {
    nftArray = nftArray.concat(result[i][0]);
  }
  return nftArray;
}


async function renderCollection(nftTokens) {
  // Caso haja nfts
  if (nftTokens) {
    let element = '<div class="d-flex flex-column justify-content-between p-md-1">';
    for (var key in nftTokens) {
      let tokenId = nftTokens[key];
      metadata = (await nftMetadata(tokenId))?.message;
      metadataArray.push(metadata);
      element +=
        '<div class="card shadow-lg mt-3">' +
        '<div class="card-body flex-column">' +
        '<div class="d-flex justify-content-between p-md-1">' +
        '<div class="d-flex flex-row">' +
        '<div class="align-self-center">' +
        '<i class="fa-solid fa-tree fa-4x tree-icon"></i>' +
        "</div>" +
        "<div>" +
        `<button class="accordion-button" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#${tokenId.replace(
          /\s/g,
          ""
        )}" aria-controls="${tokenId}"> <h3> ${tokenId}  </h3> </button>` +
        (await renderMetadata(tokenId, metadata)) +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>";

      // Renderizar a cada nft carregado
      document.getElementById("nft-showroom").innerHTML = element;
    }
    // // Hides the loading image and displays the file upload fields again in case of client-side signing
    // if (localStorage.getItem("keyOnServer") == "false")
    //   document.getElementById("signing-files").style.display = "block";
    // document.getElementById("loader").style.display = "none";
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }
}

//TODO: consertar getURI para modo offline

// Recuperar json dos metadados do nft (dado tokenId)
async function nftMetadata(tokenId) {
  let response;
  if (localStorage.getItem("keyOnServer") == "true") {
    let token = localStorage.getItem("token");
    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + token);
  
    let url = `http://localhost:4000/meta/getMetadata?tokenId=${tokenId}`;
    var init = {
      method: "POST",
      headers: headers,
    };
  
    response = await fetch(url, init);

  } else {
    let transaction = {
      chaincodeId: 'erc1155',
      channelId: 'mychannel',
      fcn: "GetURI",
      args: [tokenId]
    };
    // GetURI Transaction
    response = await client.offlineTransaction(transaction);
    let URI = response.payload;

    // GetMetadata
    let token = localStorage.getItem("token");
    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + token);
    let body = JSON.stringify({
      URI: URI
    });
    let url = `http://localhost:4000/meta/getMetadata?tokenId=${tokenId}`;
    var init = {
      method: "POST",
      headers: headers,
      body: body
    };
  
    response = await fetch(url, init);

  }
  return response.json();
}

// Retorna string com a construção dos metadados de dado nft (em div accordion colapsavel)
async function renderMetadata(tokenId, metadata) {
  if (!metadata.name) return "Metadados não recuperados";
  return (
    `<div id="${tokenId.replace(/\s/g, "")}" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#accordionExample"> <div class="accordion-body">` +
    "<p>" +
    // `<b> Proprietário da Terra: </b> ${metadata?.properties?.land_owner} <br />` +
    `<b> Fitofisiologia: </b> ${metadata?.properties?.land_info?.phyto} <br />` +
    `<b> Geolocalização: </b> ${metadata?.properties?.land_info?.geolocation} <br />` +
    // `<b> Custom Notes: </b> ${metadata?.properties?.custom_notes} <br />` + //TODO: adicionar campo especifico para qty nos metadados (informacao da pagina de mintNFT)
    renderCompensation(tokenId.replace(/\s/g, ""), metadata?.properties?.compensation_state) +
    "<p>" +
    "</div>"
  );
}

// Retorna string do metadado de compensação, dependendo do estado
function renderCompensation(tokenId, compensation_state) {
  switch (compensation_state) {
    case "Aguardando":
      return `<b> Estado de compensação:</b> Aguardando <br />`;
    case "Compensado":
      return `<b> Estado de compensação:</b> Compensado <br />`;
    // Inclui botão de compensação quando não compensado
    case "Não Compensado":
    default:
      return (
        `<b> Estado de compensação:</b> Não compensado <br />` +
        `<button id="submitCompensationButton" type="submit" style="display: flex" class="btn btn-primary btn-md mt-3" onclick="window.compensate(${tokenId})">Compensar</button>`
      );
  }
}

//change token status to "Compensado" in the IPFS
//OBS: funções de escrita e leitura dos metadados no IPFS foram feitas de maneira desiguais, deveriam receber/retornar mesma estrutura json. Por isso, apenas alguns campos são mantidos ao se compensar (ver variável body)
window.compensate = async (tokenId) => {
  event.preventDefault();

  //set loading
  document.getElementById("loader").style.display = "block";
  document.getElementById("submitCompensationButton").style.display = "none";

  tokenId = tokenId.id;

  let jwt = localStorage.getItem("token");

  // 1. Patch Metadata

  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + jwt);
  let url;

  var init = {
    method: "PATCH",
    headers: headers,
  };

  //get token info
  let tokenInfo = metadataArray.filter((metadataArray) => metadataArray.name === tokenId);
  tokenInfo = tokenInfo[0].properties;

  let body = {
    tokenId,
    metadata: {
      id: tokenId,
      phyto: tokenInfo.land_info.phyto,
      geolocation: tokenInfo.land_info.geolocation,
      status: "Ativo",
      compensation_state: "Compensado",
    },
  };

  init.body = JSON.stringify(body);

  // POST to postMetadata
  url = `http://${HOST}:${PORT}/meta/patchMetadata`;
  let patchMetadataResponse = await fetch(url, init);
  let metadataHash = (await patchMetadataResponse.json())?.metadataHash
  const URI = `http://${metadataHash}.com`;

  // 2. Set URI Metadata in World State
  let response;
  if (localStorage.getItem("keyOnServer") == "true") {
    // Publicar URI e TokenId no chaincode por meio de chamada em invoke controller (SetURI)
    url = `http://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/setURI`
    body = JSON.stringify({
      URI: URI,
      tokenId: tokenId
    });
    init = {
      method: "POST",
      headers: headers,
      body: body
    };
  
    response = await fetch(url, init);
  } else {
    const transaction = {
      chaincodeId: 'erc1155',
      channelId: 'mychannel',
      fcn: "SetURI",
      args: [tokenId, URI]
    };

    response = await client.offlineTransaction(transaction);
  }


  // let element =
  //   `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
  //   `Compensando...` +
  //   `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  //   `</div>`;
  // document.getElementById("flash").innerHTML = element;

  if (response.ok || !!response.result) {
    document.getElementById("loader").style.display = "none";
    if (localStorage.getItem("keyOnServer") == "true") response = await response.json();
    if (response.result.toLowerCase() != "success") {
      let element = failureCompensationFlashMessage;
      document.getElementById("flash").innerHTML = element;
    } else {
      let element = successCompensationFlashMessage;
      document.getElementById("flash").innerHTML = element;
    }
    window.location.href = `/collection`;
  } else {
    document.getElementById("loader").style.display = "none";
    console.log("HTTP Error ", response.status);
    let element = failureCompensationFlashMessage
    document.getElementById("flash").innerHTML = element;
    return null;
  }
}
