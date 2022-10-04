async function mintFT(){

    event.preventDefault();

    document.getElementById("loader").style.display = "flex";
    document.getElementById("submitButton").style.display = "none";

    let username = document.getElementById("username").value;
    let qty = document.getElementById("qty").value;

    let token = localStorage.getItem("token");

    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + token)
    let url = "http://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/mint";

    var init = {
        method: "POST",
        headers: headers,
    };

      body = {
        tokenId: "$ylvas",
        tokenAmount: qty,
        tokenReceiver: username,
      };

    init.body = JSON.stringify(body);

    let response = await fetch(url, init);

    if (response.ok) {
        response = await response.json();
        if (response.result==null) {
            alert(`Emissao de Sylvas falhou`);
        } else {
            document.getElementById("submitButton").style.display = "flex";
            document.getElementById("loader").style.display = "none";
            alert("Emissao de Sylvas realizado com sucesso");
        }
    } else {
      console.log("HTTP Error ", response.status);
      return null;
    }

}

async function mintNFT(){

    event.preventDefault();

    document.getElementById("loader").style.display = "flex";
    document.getElementById("submitButton").style.display = "none";

    let username = document.getElementById("username").value;
    let nftId = document.getElementById("nftId").value
    let phyto = document.getElementById("phyto").value
    let location = document.getElementById("location").value
    let qty = document.getElementById("amount").value

    let token = localStorage.getItem("token");

    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + token)
    let url = "http://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/mint";

    var init = {
        method: "POST",
        headers: headers,
    };

      body = {
        tokenId: nftId,
        tokenAmount: qty,
        tokenReceiver: username,
      };

    init.body = JSON.stringify(body);

    let response = await fetch(url, init);

    if (response.ok) {
        response = await response.json();
        if (response.result==null) {
            alert(`Emissao de NFT falhou`);
        } else {
            document.getElementById("submitButton").style.display = "flex";
            document.getElementById("loader").style.display = "none";
            alert("Emissao de NFT realizado com sucesso");
        }
    } else {
      console.log("HTTP Error ", response.status);
      return null;
    }

}