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
    `<div id="${tokenId.replace(/\s/g, "")}" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample"> <div class="accordion-body">` +
    "<p>" +
    `<b> Status: </b> ${nftinfo?.metadata?.status} <br />` +
    `<b> Quantidade: </b> ${nftinfo?.amount} <br />` +
    `<b> Proprietário da Terra: </b> ${nftinfo?.metadata?.land_owner} <br />` +
    `<b> Área (hectares): </b> ${nftinfo?.metadata?.land} <br />` +
    `<b> Fitofisiologia: </b> ${nftinfo?.metadata?.phyto} <br />` +
    `<b> Geolocalização: </b> ${nftinfo?.metadata?.geolocation} <br />` +
    `<b> Dono dos direitos de Compensação: </b> ${nftinfo?.metadata?.compensation_owner} <br />` +
    `<b> Geração de Sylvas: </b> ${nftinfo?.metadata?.mint_sylvas} <br />` +    
    renderCompensation(tokenId.replace(/\s/g, ""), nftinfo?.metadata?.compensation_state) +
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
        `<button id="submitCompensationButton" type="submit" style="display: flex" class="btn btn-primary btn-md mt-3" onclick="compensate(${tokenId})">Compensar</button>` // TokenID.slice(1) remove o _ colocado na frente do ID para nao ter problema na visualização
      );
  }
}

//change token status to "Compensado" in the World State
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
