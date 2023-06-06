let metadata;
let metadataArray = [];

async function collection() {
  // Recuperar todos os nfts do usuario
  let nftTokens = await getNftTokens();
  // Caso haja nfts
  if (nftTokens) {
    let element = '<div class="d-flex flex-column justify-content-between p-md-1">';
    if (nftTokens.length == 0){
      element +=
<<<<<<< HEAD
        '<center><h2><font color="#5f5f5f">Você não possui NFTs em sua coleção </font></h2> </center>'+
        "</div>";
        document.getElementById("nft-showroom").innerHTML = element;        
    }else{
      for (var key in nftTokens) {
        let tokenId = nftTokens[key][0];
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
          )}" aria-controls="${tokenId}"> ${tokenId.slice(1)} </button>` + // TokenID.slice(1) remove o _ colocado na frente do ID para nao ter problema na visualização
          await renderMetadata(tokenId,JSON.parse(nftTokens[key][1])) +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>";

        // Renderizar a cada nft carregado
        document.getElementById("nft-showroom").innerHTML = element;
      }
=======
        '<div class="card shadow-lg mt-3">' +
        '<div class="card-body flex-column">' +
        '<div class="d-flex justify-content-between p-md-1">' +
        '<div class="d-flex flex-row">' +
        '<div class="align-self-center">' +
        '<i class="fa-solid fa-tree fa-4x tree-icon"></i>' +
        "</div>" +
        "<div>" +
        `<button class="accordion-button" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#tk${tokenId.replace(
          /\s/g,
          ""
        )}" aria-controls="tk${tokenId}"> ${tokenId} </button>` +
        (await renderMetadata(tokenId, metadata)) +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>";

      // Renderizar a cada nft carregado
      document.getElementById("nft-showroom").innerHTML = element;
      //Habilita card, pois algumas opções o desabilitam
      document.getElementById("nft-showroom").style.display = "block";
>>>>>>> marketplaceFront
    }
  }else {
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
  let result = (await response.json());
  let nftArray = [];
  // Retornar array contendo somente a lista de ids dos nfts
  for (var i in result) {
    nftArray = nftArray.concat(result[i]);
  }

  for (var el in nftArray){
    // Adiciona um _ na frente dos ids para evitar problemas de nomeclatura de ID com HTML4 (Ids iniciando com numeros não sao aceitos)    
    nftArray[el][0] = "_"+ nftArray[el][0];
  }
  return nftArray;
}

// Retorna string com a construção dos metadados de dado nft (em div accordion colapsavel)
async function renderMetadata(tokenId,nftinfo) {
  if (!nftinfo.amount) return "Metadados não recuperados";
  return (
    `<div id="tk${tokenId.replace(/\s/g, "")}" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample"> <div class="accordion-body">` +
    "<p>" +
<<<<<<< HEAD
    `<b> Status: </b> ${nftinfo?.metadata?.status} <br />` +
    `<b> Quantidade: </b> ${nftinfo?.amount} <br />` +
    `<b> Proprietário da Terra: </b> ${nftinfo?.metadata?.land_owner} <br />` +
    `<b> Área (hectares): </b> ${nftinfo?.metadata?.land} <br />` +
    `<b> Fitofisiologia: </b> ${nftinfo?.metadata?.phyto} <br />` +
    `<b> Geolocalização: </b> ${nftinfo?.metadata?.geolocation} <br />` +
    `<b> Dono dos direitos de Compensação: </b> ${nftinfo?.metadata?.compensation_owner} <br />` +
    `<b> Geração de Sylvas: </b> ${nftinfo?.metadata?.mint_sylvas} <br />` +    
    renderCompensation(tokenId.replace(/\s/g, ""), nftinfo?.metadata?.compensation_state) +
=======
    `<b> Status: </b> ${metadata?.properties?.status} <br />` +
    // `<b> Quantidade: </b> ${metadata?.properties?.amount} <br />` +
    `<b> Proprietário da Terra: </b> ${metadata?.properties?.land_owner} <br />` +
    `<b> Área (hectares): </b> ${metadata?.properties?.land} <br />` +
    `<b> Fitofisiologia: </b> ${metadata?.properties?.phyto} <br />` +
    `<b> Geolocalização: </b> ${metadata?.properties?.geolocation} <br />` +
    `<b> Dono dos direitos de Compensação: </b> ${metadata?.properties?.compensation_owner} <br />` +
    `<b> Geração de Sylvas: </b> ${metadata?.properties?.mint_sylvas} <br />` +    
    await renderCompensation(tokenId.replace(/\s/g, ""), metadata?.properties?.compensation_state) +
>>>>>>> marketplaceFront
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
<<<<<<< HEAD
        `<b> Estado de compensação:</b> Não compensado <br />` +
        `<button id="submitCompensationButton" type="submit" style="display: flex" class="btn btn-primary btn-md mt-3" onclick="compensate(${tokenId})">Compensar</button>` // TokenID.slice(1) remove o _ colocado na frente do ID para nao ter problema na visualização
=======
        `<b> Estado de compensação:</b> Não compensado <br />` +  
        await renderListForSale(tokenId) 
>>>>>>> marketplaceFront
      );
  }
}

<<<<<<< HEAD
//change token status to "Compensado" in the World State
=======
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
      `<button id="lisForSaleButton${tokenId}" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#setPriceForm${tokenId}" aria-controls="setPrice" style="display: flex" class="btn btn-primary btn-md mt-3" > Anunciar </button>` +       
    '</span>'+

     `<div id="setPriceForm${tokenId}" class="validated-form collapse">` +
       '<div class="flex-fill">'+
          '<label class="form-label" for="price">Insira o preço em $ylvas</label>'+ 
          '<br />'+
          '<span style="display: inline-block; margin-right: 10px; margin-top: 10px">'+
            '<i class="fas fa-coins fa-lg" aria-hidden="true"></i>'+'</span>'+
          '<span style="display: inline-block;">'+
            '<input type="text" name="priceInput" id="priceInput" class="form-control" required/>'+
          '</span>'+  
       '</div>'+

        `<span style="display: inline-block; margin-right: 10px;  margin-top: 20px">`+
          `<button id="submitOfferButton" type="button" style="display: flex" class="btn btn-primary btn-md" onclick='listForSale("${tokenId}")'> Enviar </button>`+
        '</span>'+
      '<span style="display: inline-block;">'+
        `<button id="CancelOfferButton" type="button" style="display: flex" class="btn btn-primary btn-md" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#setPriceForm${tokenId}">Cancelar</button>`+
      '</span>'+
    `</div>`
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
  document.getElementById("nft-showroom").style.display = "none";
  document.getElementById("loader").style.display = "flex";

  tokenIdValue = tokenIdInput.replace(/\s/g, "");
  let priceValue = document.getElementById("priceInput").value;

  console.log(tokenIdValue);
  console.log(priceValue);

  let jwt = localStorage.getItem("token");
  
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + jwt);
  headers.append("Content-Type", "application/json");

  let url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/ListForSale`;

  var init = {
    method: "POST",
    headers: headers,
  };

  body = {
    tokenId: tokenIdValue,
    price: priceValue
  }; 

  init.body = JSON.stringify(body);

  let response = await fetch(url, init);
  
  if (response.ok) {
    
    response = await response.json();
    if (response.result != "success") {
      await collection();
      let element =
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Ocorreu um erro na publicação do produto` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    } else {
      await collection();
      let element =
        `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Publicação do produto realizada com sucesso` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    }
  }
  else {
    document.getElementById("loader").style.display = "none";
    console.log("HTTP Error ", response.status);
    await collection();
    let element =
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
      `Ocorreu um erro na publicação do produto` +
      `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
      `</div>`;
    document.getElementById("flash").innerHTML = element;
    return null;
  }

}

//change token status to "Compensado" in the IPFS
//OBS: funções de escrita e leitura dos metadados no IPFS foram feitas de maneira desiguais, deveriam receber/retornar mesma estrutura json. Por isso, apenas alguns campos são mantidos ao se compensar (ver variável body)
>>>>>>> marketplaceFront
async function compensate(tokenId) {
  event.preventDefault();

  //set loading
  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitCompensationButton").style.display = "none";

  let element =
  `<div class="alert alert-warning alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Compensando...` +
  `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

  document.getElementById("flash").innerHTML = element;  

  tokenId = (tokenId.id).slice(1);

  let jwt = localStorage.getItem("token");

  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + jwt);
  let url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/compensateNFT`;
  
  var init = {
    method: "PATCH",
    headers: headers,
  };  


  let body = {
    tokenId,
  };

  init.body = JSON.stringify(body);

  //POST to postMetadata
  let response = await fetch(url, init);


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


