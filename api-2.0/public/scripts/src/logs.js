// Flash messages that are displayed to the user in case of success or failure of the transaction execution
const successFlashMessage =
  `<div  id="flash-message" class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Consulta realizada com sucesso` +
  `<button id="flash-button" type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

const failureFlashMessage =
  `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Ocorreu um erro na consulta` +
  `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

const failureFlashMessage2 =
  `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Nenhum bloco foi adicionado ainda ao IPFS` +
  `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

//retrieve last block in IPFS
async function getLatestIPFSBlock() {
  //loading...
  document.getElementById("loader").style.display = "flex";

  //make request to the backend
  let url = `https://${HOST}:${PORT}/ipfs/getLatestIPFSBlock`;
  var init = {
    method: "GET",
  };
  let response = await fetch(url, init);

  //stop loading
  document.getElementById("loader").style.display = "none";

  if (response.ok) {
    response = await response.json();

    //set block info in HTML
    document.getElementById("flash").innerHTML = successFlashMessage;
    ipfsBlockNumber.innerText = String(response.tail.info.height - 1);
    ipfsHash.innerText = response.tail.info.currentBlockHash;
    ipfsPreviousHash.innerText = response.tail.info.previousBlockHash;
    ipfsTimestamp.innerText = response.tail.data.data[0].payload.header.channel_header.timestamp;

    //remove info from json, it doesn't belong to the original json
    delete response.tail.info;
    ipfsJson.innerText = JSON.stringify(response.tail, null, 4);
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage2;
    console.log("HTTP Error ", response.status);
  }
}

//retrieve blockchains's last block
async function getBlockchainTail() {
  //make request to the backend
  let url = `https://${HOST}:${PORT}/query/channels/mychannel/chaincodes/erc1155/getBlockchainTail`;
  var init = {
    method: "GET",
  };
  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();

    //set block info in HTML
    document.getElementById("flash").innerHTML = successFlashMessage;
    tailJson.innerText = JSON.stringify(response.tail, null, 4);
    tailBlockNumber.innerText = String(response.info.height - 1);
    tailHash.innerText = response.info.currentBlockHash;
    tailPreviousHash.innerText = response.info.previousBlockHash;
    tailTimestamp.innerText = response.tail.data.data[0].payload.header.channel_header.timestamp;
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    console.log("HTTP Error ", response.status);
  }
}
