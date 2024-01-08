async function collectionCompensation() {

  // Recuperar todos os nfts do usuario
  let nftTokens = await getNftCompensationTokens();

  // Caso haja nfts
  if (nftTokens) {
    let element = '<div class="d-flex flex-column justify-content-between p-md-1">';
    if (nftTokens.length === 0){
      element +=
        '<center><h2><font color="#5f5f5f">Você não possui NFT de compensação s em sua coleção </font></h2> </center>'+
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
                    )}" aria-controls="tk${tokenId}"> 
                        ID NFT Direito de Compensação: ${tokenId.slice(1)} -
                        ID NFT Terra Relacionada: ${nftTokens[key][1]}
                    
                    </button>` + // TokenID.slice(1) remove o _ colocado na frente do ID para nao ter problema na visualização
                    await renderMetadata(tokenId,JSON.parse(nftTokens[key][2])) +
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
                  <button type="button" class="btn btn-primary" data-bs-dismiss="modal" onclick=''> Confirmar </button>
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
  }else {
    console.log("HTTP Error ", response.status);
    return null;
  }

  //Desabilitar gif do loader
  document.getElementById("loader").style.display = "none";
}

// Recupera os nfts do usuario logado
async function getNftCompensationTokens() {
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `https://${HOST}:${PORT}/query/channels/mychannel/chaincodes/erc1155/SelfBalanceNFTCompensation`;
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
  if (!nftinfo.compensation_total_area) return "Metadados não recuperados";
  return (
    `<div id="tk${tokenId.replace(/\s/g, "")}" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample"> <div class="accordion-body">` +
    "<p>" +
    `<b> Área Total (hectares): </b> ${nftinfo?.compensation_total_area} <br />` +
    `<b> Área Disponivel para Compensação (hectares): </b> ${nftinfo?.compensation_area_supply} <br />` +    
    `<b> Status de Compensação: </b> ${nftinfo?.compensation_state} <br />` +
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
