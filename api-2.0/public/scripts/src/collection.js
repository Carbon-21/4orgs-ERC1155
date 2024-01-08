
let metadata;
let metadataArray = [];

async function collection() {

/*  Inicializa status dos nfts = "minted". 
    - O status do NFT não é definido na sua criação e é preciso ter um status inicial 
    padrão para tirar o NFT da loja mudando o seu status "sale" para outro. 
    - A função que cria o status só pode ser utilizada pelo dono do nft, por isso ela 
    é chamada dentro da collection.  
    - Status: "minted" = NFT não está a venda; "sale" =  NFT à venda. 
*/
  await setStatusMinted(0);

  // Recuperar todos os nfts do usuario
  let nftTokens = await getNftTokens();

  // Recuperar todos os nfts requests do usuario
  let nftRequests = await getNftRequests();
  // Caso haja nfts ou nft requests
  if (nftTokens || nftRequests) {
    let element = '<div class="d-flex flex-column justify-content-between p-md-1">';
    if (!nftTokens || nftTokens.length === 0){
      element +=
        '<center><h2><font color="#5f5f5f">Você não possui NFTs em sua coleção </font></h2> </center>'+
        "</div>";
        document.getElementById("nft-showroom").innerHTML = element;        
    }else{
      for (var key in nftTokens) {
        let tokenId = nftTokens[key][0];
        element +=
          '<div class="card shadow-lg mt-3 ">' +
          '<div class="card-body flex-column">' +
          '<div class="d-flex justify-content-between p-md-1">' +
          '<div class="d-flex flex-row">' +
          '<div class="align-self-center">' +
            '<i class="fa-solid fa-tree fa-4x tree-icon"></i>' +
          "</div>" +
          '<div class="overflow-hidden"> ' +
          `<button class="accordion-button" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#tk${tokenId.replace(
            /\s/g,
            ""
          )}" aria-controls="tk${tokenId}"> ${tokenId.slice(1)} </button>` + // TokenID.slice(1) remove o _ colocado na frente do ID para nao ter problema na visualização
          await renderMetadata(tokenId,JSON.parse(nftTokens[key][1])) +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +

              
          `<div class="modal fade" id="staticBackdrop${tokenId}" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h1 class="modal-title fs-5" id="staticBackdropLabel">Modal title</h1>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <b> Preço: </b>  C21<br />
                  <b> Taxa: </b>  C21 <br /> 
                  <b> Total: </b>  C21<br />
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                  <button type="button" class="btn btn-primary" data-bs-dismiss="modal" onclick='buy("${tokenId}")'> Confirmar </button>
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

    //Desabilitar gif do loader
    document.getElementById("loader").style.display = "none";

    let element2 = '<div class="d-flex flex-column justify-content-between p-md-1">';
    if (!nftRequests || nftRequests.length === 0){
      element2 +=
        '<center><h2><font color="#5f5f5f">Você não possui solitações de NFT</font></h2> </center>'+
        "</div>";
        document.getElementById("request-showroom").innerHTML = element2;        
    }else{
      nftRequests.requests.map((request) => {
        let requestId = request.id;
        // let username = request.username;
        let landOwner = request.landOwner;
        let landArea = request.landArea;
        let phyto = request.phyto;
        let geolocation = request.geolocation;
        let certificate = request.certificate;
        let status = request.requestStatus;
        let userNotes = request.userNotes;
        let adminNotes = request.adminNotes

        const buffer = new Uint8Array(request.certificate.data);
        const blobTest = new Blob([buffer], { type: 'application/pdf'});

        element2 +=
          '<div class="card shadow-lg mt-3 ">' +
          '<div class="card-body flex-column">' +
          '<div class="d-flex justify-content-between p-md-1">' +
          '<div class="d-flex flex-row">' +
          '<div class="align-self-center">' +
            '<i class="fa-solid fa-tree fa-4x tree-icon"></i>' +
          "</div>" +
          '<div class="overflow-hidden"> ' +
          `<button class="accordion-button" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#tk${requestId}" aria-controls="tk${requestId}"> Solicitação ${requestId} </button>` +
          `<b> Status: </b> ${status} <br />` +
          `<div id="tk${requestId}" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample"> <div class="accordion-body">` +
          `<b> Proprietário da Terra: </b> ${landOwner} <br />` +
          `<b> Área (hectares): </b> ${landArea} <br />` +
          `<b> Fitofisiologia: </b> ${phyto} <br />` +
          `<b> Geolocalização: </b> ${geolocation} <br />` +
          `<b> Dono dos direitos de Compensação: </b> ${landOwner} <br />` +
          `<div class="d-flex align-items-center">` +
          `<i class="fa fa-download fa-lg"></i>` +
          `<a id="cert" href="${URL.createObjectURL(blobTest)}" download="certificate.pdf">Download Certificate</a>` +      
          "</div>" +
          `<b> Notas usuário: </b> ${userNotes} <br />` +
          `<b> Notas admin: </b> ${adminNotes} <br />` +       
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>";

        // Renderizar a cada request carregado
        document.getElementById("request-showroom").innerHTML = element2;
        //Habilita card, pois algumas opções o desabilitam
        document.getElementById("request-showroom").style.display = "block";
      })
      //Desabilitar gif do loader2
      document.getElementById("loader2").style.display = "none";
    }
  }else {
    console.log("HTTP Error ");
    return null;
  }

  //Desabilitar gif do loader
  document.getElementById("loader").style.display = "none";
  document.getElementById("loader2").style.display = "none";
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

async function getNftRequests() {
  let token = localStorage.getItem("token");
  let userId = localStorage.getItem("userId");
  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + token);

  // trocar para variaveis de host e port
  let url = `https://${HOST}:${PORT}/nft/requests/${userId}`;

  var init = {
    method: "GET",
    headers: headers
  };

  let response = await fetch(url, init);
  
  if (response.ok) {
    return await response.json();
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }
}

// Retorna string com a construção dos metadados de dado nft (em div accordion colapsavel)
async function renderMetadata(tokenId,nftinfo) {
  if (!nftinfo.amount) return "Metadados não recuperados";
  return (
    `<div id="tk${tokenId.replace(/\s/g, "")}" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample"> <div class="accordion-body">` +
    "<p>" +
    `<b> Status: </b> ${nftinfo?.metadata?.status} <br />` +
    `<b> Proprietário da Terra: </b> ${nftinfo?.metadata?.land_owner} <br />` +
    `<b> Área (hectares): </b> ${nftinfo?.metadata?.land_area} <br />` +
    `<b> Fitofisiologia: </b> ${nftinfo?.metadata?.phyto} <br />` +
    `<b> Geolocalização: </b> ${nftinfo?.metadata?.geolocation} <br />` +
    `<b> Dono dos direitos de Compensação: </b> ${nftinfo?.metadata?.compensation_owner} <br />` +
    `<b> Geração de C21: </b> ${nftinfo?.metadata?.mint_sylvas} <br />` +    
    `<b> Potencial de geração de C21: </b> ${nftinfo?.metadata?.mint_rate} <br />` +        
    `<b> Tipo do NFT: </b> ${nftinfo?.metadata?.nft_type} <br />` +        
    `<b> Notas: </b> ${nftinfo?.metadata?.custom_notes} <br />` +
    "<p>" +           
    await renderCompensation(tokenId.replace(/\s/g, ""), nftinfo?.metadata?.compensation_state, nftinfo?.metadata?.nft_type) +
    "<p>" +
    await renderListForSale(tokenId.replace(/\s/g, "")) +    
    "<p>" +
    "</div>"
  );
}

// Retorna string do metadado de compensação, dependendo do estado
async function renderCompensation(tokenId, compensation_state, nft_type) {
  if(nft_type === "corte"){
    return `<b> Estado de compensação:</b> Não permitido <br />`;
  }else{
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
          `<button id="submitCompensationButton" type="submit" style="display: flex" class="btn btn-primary btn-md mt-2 mb-2" onclick='compensate("${tokenId}")'>Compensar</button>`        
        );
    }
  }
}

// Retorna metadado com estado da loja
async function renderListForSale(tokenId) {

  let nftMintedList = await getNftOnStatus("minted");
  let nftSaleList = await getNftOnStatus("sale");

  let element ="";
  let taxPercentage;
  let taxObs = "";

  //tenta pegar o valor da taxa a partir de um nft "minted"
  if (nftMintedList) {
    
    if(nftMintedList.length!==0){
      taxPercentage = parseInt(nftMintedList[0].taxPercent);
      taxObs = "( Taxação = " + taxPercentage + "% )";
    }
  } 
  
  //tenta pegar a taxa a partir de um nft "sale"
  if(taxObs === "" && nftSaleList){

    if(nftSaleList.length!==0){
      taxPercentage = parseInt(nftSaleList[0].taxPercent);
      taxObs = "( Taxação = " + taxPercentage + "% )";
    }
  }

  if (nftSaleList){
    for (var key in nftSaleList) {
      if (tokenId.slice(1) == nftSaleList[key].id){
        element += 
          `<b> Estado na loja :</b> Disponível <br />

          <span style="display: inline-block;">
            <button id="setMinted${tokenId}" type="button" style="display: flex" class="btn btn-primary btn-md mt-2 mb-2" onclick='setStatus("${tokenId}","minted")'> Retirar da loja </button>       
          </span>

          <span style="display: inline-block;">
            <button id="setStatusButton${tokenId}" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#setPriceForm${tokenId}" aria-controls="setPrice" style="display: flex" class="btn btn-primary btn-md mt-2 mb-2" > Editar preço </button>       
          </span>`
      }
    }
  }

  if (element===""){
    element +=
  
    `<b> Estado na loja :</b> Indisponível <br />
    <span style="display: inline-block;">
      <button id="lisForSaleButton${tokenId}" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#setPriceForm${tokenId}" aria-controls="setPrice" style="display: flex" class="btn btn-primary btn-md mt-2 mb-2" > Anunciar </button>
    </span>`
  }

  return(
    element += 
    `<div id="setPriceForm${tokenId}" class="validated-form collapse">` +
       '<div class="flex-fill">'+
          `<label class="form-label" for="price">Insira o preço em C21 ${taxObs}</label>`+ 
          '<br />'+
          '<span style="display: inline-block; margin-right: 10px; margin-top: 10px">'+
            '<i class="fas fa-coins fa-lg" aria-hidden="true"></i>'+'</span>'+
          '<span style="display: inline-block;">'+
            '<input type="text" name="priceInput" id="priceInput" class="form-control" required/>'+
          '</span>'+  
       '</div>'+

        `<span style="display: inline-block; margin-right: 10px;  margin-top: 20px">`+
          `<button id="confirmPriceButton" type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#staticBackdrop${tokenId}" onclick='renderModal("${taxPercentage}","${tokenId}")'> Enviar </button>`+
        '</span>'+
      '<span style="display: inline-block;">'+
        `<button id="CancelOfferButton" type="button" style="display: flex" class="btn btn-primary btn-md" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#setPriceForm${tokenId}">Cancelar</button>`+
      '</span>'+
    `</div>`
  );

}

// Recuperar todos os nfts com status "sale"
async function getNftOnStatus(status) {
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `https://${HOST}:${PORT}/query/channels/mychannel/chaincodes/erc1155/getStatus?status=${status}`;

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

    let nftMarketData = {
      id: result[i][1],
      price: result[i][3],
      taxPercent: result[i][4],
    };

    nftArray = nftArray.concat(nftMarketData);
  }

  return nftArray;
}

async function renderModal(taxPercentage, tokenId) {


  let price = document.getElementById("priceInput").value;
  let taxes = parseInt(price*taxPercentage/100);
  let priceWithTaxes = parseInt(price)+taxes;
  let element=
     `<div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="staticBackdropLabel">Confirmação de postagem na loja</h1>
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
            <button id="comprar" type="button" class="btn btn-primary" data-bs-dismiss="modal" onclick='setStatus("${tokenId}","sale",${price})'>Confirmar</button>
          </div>
        </div>
      </div>`;

  document.getElementById(`staticBackdrop${tokenId}`).innerHTML = element;

}

async function setStatus(tokenIdInput, statusIn, priceIn) {
  document.getElementById("nft-showroom").style.display = "none";
  document.getElementById("loader").style.display = "flex";

  tokenIdValue = (tokenIdInput).slice(1);

  let priceValue = 1;

  if(statusIn === "sale"){
    priceValue = priceIn;
  }

  let jwt = localStorage.getItem("token");
  
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + jwt);
  headers.append("Content-Type", "application/json");

  let url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/setStatus`;

  var init = {
    method: "POST",
    headers: headers,
  };

  body = {
    tokenId: tokenIdValue,
    status: statusIn,
    price: priceValue
  }; 

  init.body = JSON.stringify(body);
  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();
    if (response.result !== "success") {
      await collection();
      let element =
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Ocorreu um erro` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    } else {
      await collection();
      let element =
        `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Ação finalizada com sucesso` +
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
      `Ocorreu um erro` +
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

  let element =
  `<div class="alert alert-warning alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Compensando...` +
  `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

  document.getElementById("flash").innerHTML = element;  
  tokenId = tokenId.slice(1);

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
    if (response.result !== "success") {
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

//definir status como "minted" de todos os nfts sem status (tokenId = null) 
//ou de um nft que deve ser retirado da loja (tokenId !== null)
async function setStatusMinted(tokenId) {

  if (tokenId === 0){
   
    let nftTokens = await getNftTokens();
    let nftTokensMinted = await getNftOnStatus("minted");
    let nftTokensSale = await getNftOnStatus("sale");
    let currentStatus = "";

    if (nftTokens){

      if (nftTokens.length===0){return;}

      //se tiver tokens, verifica se o status deles são minted ou sale 
      for (var key in nftTokens) {

        currentStatus = "";
        let tokenId = nftTokens[key][0]; //peguei um token id

        if (nftTokensMinted){
          for (var key in nftTokensMinted) {//verifica se encontramos algum token id com status minted, que seja igual a esse

            if (tokenId.slice(1) === nftTokensMinted[key].id){ 
              currentStatus = "minted";
            }
          }
        }

        if(currentStatus === "" && nftTokensSale){ //se não tiver status minted, veremos se é sale
          for (var key in nftTokensSale) {
            if (tokenId.slice(1) === nftTokensSale[key].id){
              currentStatus = "sale";
            }
          }
        }

        if(currentStatus === ""){//se não tiver status minted ou sale, setstatus = minted
          await setStatus(tokenId,"minted");
        } 
      }
    } 
  }
  else{
    await setStatus(tokenId.slice(1),"minted");
  }

  return null;
}


