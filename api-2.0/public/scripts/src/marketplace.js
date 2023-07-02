let metadata;
let metadataArray = [];

async function marketplace() {
  //Habilita gif loader
  document.getElementById("loader").style.display = "flex";
  
  // Recuperar todos os nfts com status "sale"
  let nftPrice = await getNftOnSalePrice();
  let nftMetadata = await getNftOnSaleMetadata();

  // Caso haja nfts
  if (nftMetadata && nftPrice) {
    let element = '<div class="d-flex flex-column justify-content-between p-md-1">';
    if (nftPrice.length == 0 ) {
      element +=
        '<center><h2><font color="#5f5f5f">Não existem NFTs à venda </font></h2> </center>'+
        "</div>";
        document.getElementById("nft-showroom").innerHTML = element;   
    }     
    else{ 
      for (var index in nftPrice) {
        let nftinfo = "";

        let tokenId = nftPrice[index].id;
        let price =  parseInt(nftPrice[index].price);
        let taxes =  parseInt(nftPrice[index].taxes);
        let priceWithTaxes = price + taxes;

        for (var key in nftMetadata) {
          if (nftPrice[index].id == nftMetadata[key][0]){  
            nftinfo = JSON.parse(nftMetadata[key][1]);
          }
        }

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
                            <b> ID: </b>${tokenId.slice(1)} <br /> 
                            <b> Área (hectares): </b> ${nftinfo?.metadata?.land_area} <br />
                            <b> Fitofisiologia: </b> ${nftinfo?.metadata?.phyto} <br /> 
                            <b> Geolocalização: </b> ${nftinfo?.metadata?.geolocation} <br />  
                          </p>                                          
                      </button>` +
                    '<div class="d-flex flex-row gap-2">' +
                      `<button id="seeMoreButton" class="btn btn-primary btn-md" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target='#tk${tokenId.replace(/\s/g,"")}' aria-controls="tk${tokenId}" onclick="seeMoreButton()"> 
                        Ver mais                                       
                      </button>` +
                      `<button id="buyButton" type="button" class="btn btn-primary btn-md" data-bs-toggle="modal" data-bs-target="#confirmation"> 
                        Comprar 
                      </button>`+

                    '</div>'+        
                    (await  renderMetadata(tokenId, nftinfo)) +
                  "</div>" +
                "</div>" +
                '<div class="d-flex flex-row">' +
                  '<div class="align-self-center" style="margin-right: 30px">' +
                    '<i class="fa-solid fa-coins fa-4x coin-icon"></i>'+
                  "</div>" +
                  '<div class="align-self-center">' +
                    `<h2 id="balanceHeader" class="h1 mb-0">${priceWithTaxes} C21 </h2>` +
                  '</div>' +
                '</div>' +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>"+

        `<div class="modal fade" id="confirmation" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h1 class="modal-title fs-5" id="staticBackdropLabel">Confirmação de compra</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div class="d-flex flex-row"> 
                  <div class="align-self-center" style="margin-right: 30px"> 
                    <i class="fa-solid fa-coins fa-4x coin-icon"></i>
                  </div> 
                  <div class="align-self-center">
                    <b> Preço: </b> ${price} C21<br />
                    <b> Taxa: </b> ${taxes} C21 <br /> 
                    <b> Total: </b> ${priceWithTaxes} C21<br />
                  </div>
                </div> 
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button id="comprar" type="button" class="btn btn-primary" data-bs-dismiss="modal" onclick='buy("${tokenId}")'>Confirmar</button>
              </div>
            </div>
          </div>
        </div>`;
      
        // Renderizar a cada nft carregado
        document.getElementById("nft-showroom").innerHTML = element;
        //Habilita card, pois algumas opções o desabilitam 
        document.getElementById("nft-showroom").style.display = "block";
      }
    }
  }
  else {
    console.log("HTTP Error ", response.status);
    return null;
  }
  

  //Desabilitar gif do loader
  document.getElementById("loader").style.display = "none";
}

// Recuperar o preço e a taxa de todos os nfts com status "sale"
async function getNftOnSalePrice() {
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `https://${HOST}:${PORT}/query/channels/mychannel/chaincodes/erc1155/GetStatus?status=sale`;

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
      taxes: result[i][4],
    };

    nftMarketData.id = "_" + nftMarketData.id;

    nftArray = nftArray.concat(nftMarketData);
  }

  return nftArray;
}

// Recupera os metadados dos nfts com status = sale
async function getNftOnSaleMetadata() {
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `https://${HOST}:${PORT}/query/channels/mychannel/chaincodes/erc1155/GetNFTsFromStatus?status=sale`;
  var init = {
    method: "GET",
    headers: headers,
  };

  let response = await fetch(url, init);
  let result = (await response.json());

  let nftArray = [];

  if (Object.keys(result).length == 0){
    // Retornar array contendo somente a lista de ids dos nfts
    for (var i in result) {
      nftArray = nftArray.concat(result[i]);
    }
    
    for (var el in nftArray){
      // Adiciona um _ na frente dos ids para evitar problemas de nomeclatura de ID com HTML4 (Ids iniciando com numeros não sao aceitos)    
      nftArray[el][0] = "_"+ nftArray[el][0];
    }
  }
    
  return nftArray;
}

// Retorna string com a construção dos metadados de dado nft (em div accordion colapsavel)
async function renderMetadata(tokenId, nftinfo) {

  if (!nftinfo.amount) return "Metadados não recuperados";
  return (
    `<div id="tk${tokenId.replace(/\s/g, "")}" class="accordion-collapse collapse" style="margin-top: 20px;" aria-labelledby="headingOne" data-bs-parent="#accordionExample">` +
      '<div class="accordion-body">' +
        "<p>" +
          `<b> Status: </b> ${nftinfo?.metadata?.status} <br />` +
          `<b> Quantidade: </b> ${nftinfo?.amount} <br />` +
          `<b> Proprietário da Terra: </b> ${nftinfo?.metadata?.land_owner} <br />` +
          `<b> Dono dos direitos de Compensação: </b> ${nftinfo?.metadata?.compensation_owner} <br />` +
          renderCompensation(tokenId.replace(/\s/g, ""), nftinfo?.metadata?.compensation_state) +
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

// função de compra do nft
async function buy(tokenIdInput){
  document.getElementById("nft-showroom").style.display = "none";
  document.getElementById("loader").style.display = "flex";

  tokenIdValue = (tokenIdInput).slice(1);

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

