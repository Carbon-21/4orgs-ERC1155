async function collection() {
  // Recuperar todos os nfts do usuario
  let nftTokens = await getNftTokens();
  // Caso haja nfts
  if (nftTokens) {
    let element = '<div class="d-flex flex-column justify-content-between p-md-1">';
    for (var key in nftTokens) {
      let tokenId = nftTokens[key];
      let metadata = (await nftMetadata(tokenId))?.message;
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
    //Desabilitar gif do loader
    document.getElementById("loader").style.display = "none";
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }
}

// Recupera os nfts do usuario logado
async function getNftTokens() {
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `http://localhost:4000/query/channels/mychannel/chaincodes/erc1155/selfBalanceNFT`;
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

  let url = `http://localhost:4000/meta/getMetadata?tokenId=${tokenId}`;
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
    `<div id="${tokenId.replace(/\s/g, "")}" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#accordionExample"> <div class="accordion-body">` +
    "<p>" +
    // `<b> Proprietário da Terra: </b> ${metadata?.properties?.land_owner} <br />` +
    `<b> Fitofisiologia: </b> ${metadata?.properties?.land_info?.phyto} <br />` +
    `<b> Geolocalização: </b> ${metadata?.properties?.land_info?.geolocation} <br />` +
    // `<b> Custom Notes: </b> ${metadata?.properties?.custom_notes} <br />` + //TODO: adicionar campo especifico para qty nos metadados (informacao da pagina de mintNFT)
    renderCompensation(metadata?.properties?.compensation_state) +
    "<p>" +
    "</div>"
  );
}

// Retorna string do metadado de compensação, dependendo do estado
function renderCompensation(compensation_state) {
  switch (compensation_state) {
    case "AGUARDANDO":
      return `<b> Estado de compensação:</b> Aguardando <br />`;
    case "COMPENSADO":
      return `<b> Estado de compensação:</b> Compensado <br />`;
    // Inclui botão de compensação quando não compensado
    case "NAO COMPENSADO":
    default:
      return `<b> Estado de compensação:</b> Não compensado <br />` +
        `<button id="submitCompensationButton" type="submit" style="display: flex" class="btn btn-primary btn-md">Compensar</button>`;
  }
}
