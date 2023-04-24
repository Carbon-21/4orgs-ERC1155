let metadata;
let metadataArray = [];

async function collection() {
  // Recuperar todos os nfts do usuario
  let nftTokens = await getNftTokens();
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
        )}" aria-controls="${tokenId}"> ${tokenId} </button>` +
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
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }

  //Desabilitar gif do loader
  document.getElementById("loader").style.display = "none";
}

// Recupera os nfts do usuario logado
async function getNftTokens() {
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `https://${HOST}:${PORT}/query/channels/mychannel/chaincodes/erc1155/selfBalanceNFT`;
  var init = {
    method: "GET",
    headers: headers,
  };

  let response = await fetch(url, init);
  let result = (await response.json())?.result;
  let nftArray = [];
  // Retornar array contendo somente a lista de ids dos nfts
  for (var i in result) {
    nftArray = nftArray.concat(result[i][0]);
  }
  return nftArray;
}

// Recuperar json dos metadados do nft (dado tokenId)
async function nftMetadata(tokenId) {
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + token);

  let url = `https://${HOST}:${PORT}/meta/getMetadata?tokenId=${tokenId}`;
  var init = {
    method: "GET",
    headers: headers,
  };

  let response = await fetch(url, init);
  return response.json();
}

// Retorna string com a construção dos metadados de dado nft (em div accordion colapsavel)
async function renderMetadata(tokenId, metadata) {
  if (!metadata.name) return "Metadados não recuperados";
  return (
    `<div id="${tokenId.replace(/\s/g, "")}" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample"> <div class="accordion-body">` +
    "<p>" +
    `<b> Status: </b> ${metadata?.properties?.status} <br />` +
    // `<b> Quantidade: </b> ${metadata?.properties?.amount} <br />` +
    `<b> Proprietário da Terra: </b> ${metadata?.properties?.land_owner} <br />` +
    `<b> Área (hectares): </b> ${metadata?.properties?.land} <br />` +
    `<b> Fitofisiologia: </b> ${metadata?.properties?.phyto} <br />` +
    `<b> Geolocalização: </b> ${metadata?.properties?.geolocation} <br />` +
    `<b> Dono dos direitos de Compensação: </b> ${metadata?.properties?.compensation_owner} <br />` +
    `<b> Geração de Sylvas: </b> ${metadata?.properties?.mint_sylvas} <br />` +    
    await renderCompensation(tokenId.replace(/\s/g, ""), metadata?.properties?.compensation_state) +
    "<p>" +
    "</div>"
  );
}

// Retorna string do metadado de compensação, dependendo do estado
async function renderCompensation(tokenId, compensation_state) {
  switch (compensation_state) {
    case "Aguardando":
      return `<b> Estado de compensação:</b> Aguardando <br />` + await renderListForSale(tokenId);
    case "Compensado":
      return `<b> Estado de compensação:</b> Compensado <br />`+ await renderListForSale(tokenId);
    // Inclui botão de compensação quando não compensado
    case "Não Compensado":
    default:
      return (
        `<b> Estado de compensação:</b> Não compensado <br />` +  
        await renderListForSale(tokenId) 
      );
  }
}

// Retorna string do metadado de compensação, dependendo do estado
async function renderListForSale(tokenId) {

  let nftTokens = await getNftOnSale();

  if (nftTokens){
    for (var key in nftTokens) {
      if (tokenId == nftTokens[key]){
        return  `<b> Estado na loja :</b> Disponível <br />` +  
        `<button id="submitCompensationButton" type="submit" style="display: flex" class="btn btn-primary btn-md mt-3" onclick="compensate(${tokenId})">Compensar</button>`;
      }
    }
  }

  return (
    `<b> Estado na loja :</b> Indisponível <br />` +

    '<span style="display: inline-block; margin-right: 10px;">'+
      `<button id="submitCompensationButton" type="submit" style="display: flex" class="btn btn-primary btn-md mt-3" onclick="compensate(${tokenId})">Compensar</button>`+                  
    '</span>'+
    '<span style="display: inline-block;">'+
      `<button id="lisForSaleButton" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#setPriceForm" aria-controls="setPrice" style="display: flex" class="btn btn-primary btn-md mt-3" > Anunciar </button>` +       
    '</span>'+

    `<div id="setPriceForm" class="input-group mt-3 mb-3 collapse">` +
      `<input id="priceInput" type="text" class="form-control mr-3 w-25" placeholder="Preço" />`+
      `<button id = "submitOfferButton" class="btn btn-primary w-25" style="background-color: #1fac1f; border-color: #d1e7dd" type="button" onclick="listForSale(${tokenId})">Enviar</button>`+
    `</div>`

    // `<form method = "POST" id="setPriceForm" class="validated-form collapse" onclick="listForSale(${tokenId})">`+
    //    '<div class="flex-fill">'+
    //       '<label class="form-label" for="price">Insira o preço em $ylvas</label>'+ 
    //       '<br />'+
    //       '<span style="display: inline-block; margin-right: 10px; margin-top: 10px">'+
    //         '<i class="fas fa-coins fa-lg" aria-hidden="true"></i>'+'</span>'+
    //       '<span style="display: inline-block;">'+
    //         '<input type="text" name="price" id="price" class="form-control" required/>'+
    //       '</span>'+  
    //    '</div>'+

    //     '<span style="display: inline-block; margin-right: 10px;  margin-top: 20px">'+
    //       '<button id="submitOfferButton" type="submit" style="display: flex" class="btn btn-primary btn-md"> Enviar </button>'+
    //     '</span>'+
    //   '<span style="display: inline-block;">'+
    //     '<button id="CancelOfferButton" type="button" style="display: flex" class="btn btn-primary btn-md" href="/collection">Cancelar</button>'+
    //   '</span>'+
    // '</form>'
  );

}

// Recuperar todos os nfts com status "sale"
async function getNftOnSale() {
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `https://${HOST}:${PORT}/query/channels/mychannel/chaincodes/erc1155/CheckForStatus?status=sale`;

  var init = {
    method: "GET",
    headers: headers,
  };
 
  let response = await fetch(url, init);
  let result = (await response.json())?.result;
  if(result){
    result = JSON.parse(result);
  }

  let nftArray = [];
  // Retornar array contendo somente a lista de ids dos nfts
  for (var i in result) {
    nftArray = nftArray.concat(result[i][1]);
  }

  return nftArray;
}

async function listForSale(tokenIdInput) {
    
  document.getElementById("loader").style.display = "flex";
  document.getElementById("lisForSaleButton").style.display = "none";
  document.getElementById("submitOfferButton").style.display = "none";
  //document.getElementById("CancelOfferButton").style.display = "none";

  let url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/ListForSale`;
  tokenId = tokenIdInput.id;
  let price = priceInput.value;

  console.log(tokenId);
  console.log(price);
  
  let bodyData = {
    "tokenId": tokenId,
    "price": price
  }; 

  let jwt = localStorage.getItem("token");
  
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + jwt);

  var init = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(bodyData)
  };

  let response = fetch(url, init);
  
  if (response.ok) {
    console.log("ok");
  }
  else {
    document.getElementById("loader").style.display = "none";
    console.log("HTTP Error ", response.status);
    let element =
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
      `Ocorreu um erro na compensação` +
      `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
      `</div>`;
    document.getElementById("flash").innerHTML = element;
    return null;
  }

}

//change token status to "Compensado" in the IPFS
//OBS: funções de escrita e leitura dos metadados no IPFS foram feitas de maneira desiguais, deveriam receber/retornar mesma estrutura json. Por isso, apenas alguns campos são mantidos ao se compensar (ver variável body)
async function compensate(tokenId) {
  event.preventDefault();

  //set loading
  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitCompensationButton").style.display = "none";

  tokenId = tokenId.id;

  let jwt = localStorage.getItem("token");

  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + jwt);
  let url = `https://${HOST}:${PORT}/meta/patchMetadata`;

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
      ...tokenInfo,
      compensation_state: "Compensado",
    },
  };

  init.body = JSON.stringify(body);

  //POST to postMetadata
  let response = await fetch(url, init);
  // let element =
  //   `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
  //   `Compensando...` +
  //   `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  //   `</div>`;
  // document.getElementById("flash").innerHTML = element;

  if (response.ok) {
    document.getElementById("loader").style.display = "none";
    response = await response.json();
    if (response.result != "success") {
      let element =
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Ocorreu um erro na compensação` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    } else {
      let element =
        `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Compensado com sucesso` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    }
    window.location.href = `/collection`;
  } else {
    document.getElementById("loader").style.display = "none";
    console.log("HTTP Error ", response.status);
    let element =
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
      `Ocorreu um erro na compensação` +
      `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
      `</div>`;
    document.getElementById("flash").innerHTML = element;
    return null;
  }
}


