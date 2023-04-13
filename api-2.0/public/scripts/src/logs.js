let sha = require("js-sha256");
let asnjs = require("asn1.js");

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
window.getLatestIPFSBlock = async function () {
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

    //timestamp to date
    let timestamp = new Date(response.tail.data.data[0].payload.header.channel_header.timestamp);
    timestamp = convertTZ(timestamp, "America/Sao_Paulo"); //convert to BR timezone
    timestamp = timestamp.getDate() + "/" + (timestamp.getMonth() + 1) + "/" + timestamp.getFullYear() + " " + timestamp.getHours() + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds();
    ipfsTimestamp.innerText = timestamp;

    //remove info from json, it doesn't belong to the original json
    delete response.tail.info;
    ipfsJson.innerText = JSON.stringify(response.tail, null, 4);
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage2;
    console.log("HTTP Error ", response.status);
  }
};

//retrieve blockchains's last block
window.getBlockchainTail = async function () {
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

    //timestamp to date
    let timestamp = new Date(response.tail.data.data[0].payload.header.channel_header.timestamp);
    timestamp = convertTZ(timestamp, "America/Sao_Paulo"); //convert to BR timezone
    timestamp = timestamp.getDate() + "/" + (timestamp.getMonth() + 1) + "/" + timestamp.getFullYear() + " " + timestamp.getHours() + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds();
    tailTimestamp.innerText = timestamp;
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    console.log("HTTP Error ", response.status);
  }
};

//get world state
window.getWorldState = async function () {
  //make request to the backend
  let url = `https://${HOST}:${PORT}/query/channels/mychannel/chaincodes/erc1155/getWorldState`;
  var init = {
    method: "GET",
  };
  let response = await fetch(url, init);

  if (response.ok) {
    // get WS
    response = await response.json();
    if (response.result === "") return;

    //add each keys and values from the WS to the HTML
    let htmlOutput = "";
    response.result.forEach((element) => {
      htmlOutput =
        htmlOutput +
        "<p>" +
        `<b> Origem: </b> <spam class="limit">${atob(element[2])
          .match(/CN=([^,]*)/g)[0]
          .replace("CN=", "")}</spam> <br/>` +
        `<b> Destino: </b> <spam class="limit">${atob(element[0])
          .match(/CN=([^,]*)/g)[0]
          .replace("CN=", "")}</spam> <br/>` +
        `<b> ID do Token: </b> <spam class="limit">${element[1]}</spam> <br/>` +
        `<b> Quantidade: </b><spam class="limit">${element[3]}</spam> <br/>` +
        "<p>";
    });
    ws.innerHTML = htmlOutput;

    document.getElementById("flash").innerHTML = successFlashMessage;
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    console.log("HTTP Error ", response.status);
  }
};

//retrieve all blocks, hash them and check if the resulting hashes match the retrieved ones
window.checkBlockchain = async function () {
  //make request to the backend
  let url = `https://${HOST}:${PORT}/query/channels/mychannel/chaincodes/erc1155/getRangeOfBlocks?min=início&max=10`;
  var init = {
    method: "GET",
  };
  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();
    console.log("response", response);

    //hash every block and check if they correspond to the previousHash field in the following block
    let checkedBlocksHtml = "";
    for (let i = response.min; i < response.max; i++) {
      blockchainChecking.innerHTML = checkedBlocksHtml + `Checking block ${i}...`;

      if (calculateBlockHash(response.blocks[i].header) === Buffer.from(response.blocks[i + 1].header.previous_hash).toString("base64")) {
        console.log(i, "BATEU");
        checkedBlocksHtml = checkedBlocksHtml + `Bloco ${i} OK.`;
        blockchainChecking.innerHTML = checkedBlocksHtml;
      } else {
        blockchainChecking.innerHTML = checkedBlocksHtml + "DEU RUIM";
        console.log(i, "NÃO BATEU", calculateBlockHash(response.blocks[i].header), Buffer.from(response.blocks[i + 1].header.previous_hash).toString("base64"));
      }
    }
    // response.blocks.forEach((block) => {
    //   blockchainChecking.innerHTML = "Checking...";
    //   htmlOutput =
    //     htmlOutput +
    //     "<p>" +
    //     `<b> Origem: </b> <spam class="limit">${atob(element[2])
    //       .match(/CN=([^,]*)/g)[0]
    //       .replace("CN=", "")}</spam> <br/>` +
    //     `<b> Destino: </b> <spam class="limit">${atob(element[0])
    //       .match(/CN=([^,]*)/g)[0]
    //       .replace("CN=", "")}</spam> <br/>` +
    //     `<b> ID do Token: </b> <spam class="limit">${element[1]}</spam> <br/>` +
    //     `<b> Quantidade: </b><spam class="limit">${element[3]}</spam> <br/>` +
    //     "<p>";
    // });
    // blockchainChecking.innerHTML = htmlOutput;

    //set block info in HTML
    document.getElementById("flash").innerHTML = successFlashMessage;
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    console.log("HTTP Error ", response.status);
  }
};

///// AUX /////
function convertTZ(date, tzString) {
  return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString }));
}

var calculateBlockHash = function (header) {
  let headerAsn = asnjs.define("headerAsn", function () {
    this.seq().obj(this.key("Number").int(), this.key("PreviousHash").octstr(), this.key("DataHash").octstr());
  });

  let output = headerAsn.encode(
    {
      Number: parseInt(header.number.low),
      PreviousHash: header.previous_hash.data,
      DataHash: header.data_hash.data,
    },
    "der"
  );

  let hash = sha.sha256(output);

  return Buffer.from(hash, "hex").toString("base64");
};
