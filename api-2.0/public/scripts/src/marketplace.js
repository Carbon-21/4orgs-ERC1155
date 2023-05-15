let metadata;
let metadataArray = [];

async function marketplace() {
  //Habilita gif loader
  document.getElementById("loader").style.display = "flex";
  
  // Recuperar todos os nfts com status "sale"
  let nftTokens = await getNftOnSale();
  // Caso haja nfts
  if (nftTokens) {
    let element = '<div class="d-flex flex-column justify-content-between p-md-1">';
    for (var index in nftTokens) {
      let tokenId = nftTokens[index].id;
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
                  `<button class="accordion-button cursor-pointer" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target='#tk${tokenId.replace(/\s/g,"")}' aria-controls="tk${tokenId}"> 
                      <p>
                        ${tokenId} <br />
                        <b> Área (hectares): </b> ${metadata?.properties?.land} <br />
                        <b> Fitofisiologia: </b> ${metadata?.properties?.phyto} <br /> 
                        <b> Geolocalização: </b> ${metadata?.properties?.geolocation} <br />  
                      </p>                                          
                  </button>` +
                  '<div class="d-flex flex-row gap-2">' +
                    `<button id="seeMoreButton" class="btn btn-primary btn-md" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target='#tk${tokenId.replace(/\s/g,"")}' aria-controls="tk${tokenId}" onclick="seeMoreButton()"> 
                      Ver mais                                       
                    </button>` +
                    `<button id="buyButton" type="button" class="btn btn-primary btn-md" onclick='buy("${tokenId}")' > 
                      Comprar 
                    </button>`+
                  '</div>'+        
                  (await  renderMetadata(tokenId, metadata)) +
                "</div>" +
              "</div>" +
              '<div class="d-flex flex-row">' +
                '<div class="align-self-center" style="margin-right: 30px">' +
                  '<i class="fa-solid fa-coins fa-4x coin-icon"></i>'+
                "</div>" +
                '<div class="align-self-center">' +
                  `<h2 id="balanceHeader" class="h1 mb-0">${nftTokens[index].price} Sylvas </h2>` +
                '</div>' +
              '</div>' +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>";
     
      // Renderizar a cada nft carregado
      document.getElementById("nft-showroom").innerHTML = element;
      //Habilita card, pois algumas opções o desabilitam
      document.getElementById("nft-showroom").style.display = "block";
    }
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }

  //Desabilitar gif do loader
  document.getElementById("loader").style.display = "none";
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
 
  let response = await fetch(url, init)

  let result = (await response.json())?.result;
  if(result){
    result = JSON.parse(result);
  }
  
  let nftArray = [];
  // Retornar array contendo somente a lista de ids dos nfts
  for (var i in result) {
    let nftMarketData = {
      id: result[i][1],
      price: result[i][3],
    };

    nftArray = nftArray.concat(nftMarketData);
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
    `<div id="tk${tokenId.replace(/\s/g, "")}" class="accordion-collapse collapse" style="margin-top: 20px;" aria-labelledby="headingOne" data-bs-parent="#accordionExample">` +
      '<div class="accordion-body">' +
        "<p>" +
          `<b> Status: </b> ${metadata?.properties?.status} <br />` +
          `<b> Quantidade: </b> ${metadata?.properties?.amount} <br />` +
          `<b> Proprietário da Terra: </b> ${metadata?.properties?.land_owner} <br />` +
          `<b> Dono dos direitos de Compensação: </b> ${metadata?.properties?.compensation_owner} <br />` +
          renderCompensation(tokenId.replace(/\s/g, ""), metadata?.properties?.compensation_state) +
        "<p>" +
      "</div>" +
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
    case "Não Compensado":
    default:
      return (
        `<b> Estado de compensação:</b> Não compensado <br />`
      );
  }
}

//Controla estado do botão "ver mais"
function seeMoreButton(){
  let element = document.getElementById("seeMoreButton").innerHTML;

  if (element.replace(/\s/g, "") == 'Vermais' )
  {
    element = 'Ver menos'; 
    document.getElementById("seeMoreButton").innerHTML = element;
  }
  else
  {
    element = 'Ver mais'; 
    document.getElementById("seeMoreButton").innerHTML = element;
  }
}

async function buy(tokenIdInput){
  document.getElementById("nft-showroom").style.display = "none";
  document.getElementById("loader").style.display = "flex";

  tokenIdValue = tokenIdInput.replace(/\s/g, "");

  let jwt = localStorage.getItem("token");
  
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + jwt);
  headers.append("Content-Type", "application/json");

  let url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/Buy`;
  
  var init = {
    method: "POST",
    headers: headers,
  };

  body = {
    tokenId: tokenIdValue,
  }; 

  init.body = JSON.stringify(body);

  let response = await fetch(url, init);
  
  if (response.ok) {
    
    response = await response.json();
    if (response.result != "success") {
      await marketplace();
      let element =
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Ocorreu um erro na compra do produto` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    } else {
      await marketplace();
      let element =
        `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Compra do produto realizada com sucesso` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    }
  }
  else {
    document.getElementById("loader").style.display = "none";
    console.log("HTTP Error ", response.status);
    await marketplace();
    let element =
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
      `Ocorreu um erro na compra do produto` +
      `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
      `</div>`;
    document.getElementById("flash").innerHTML = element;
    return null;
  }

}