const client = require("./transaction-handler");


window.addEventListener("load", () => {
    const keyOnServer = localStorage.getItem("keyOnServer");
    const signingFilesElement = document.getElementById("signing-files");

    // Renders uploading crypto files element conditionally, depending on the value of keyOnServer
    signingFilesElement.hidden = (keyOnServer == "true") ? true : false;
});

window.walletClientSideSigning = async () => {
    if (localStorage.getItem("keyOnServer") == "false") {
        event.preventDefault();

        const transaction = {
            chaincodeId: 'erc1155',
            channelId: 'mychannel',
            fcn: "SelfBalance",
            args: ["$ylvas"]
        };

        let response = await client.offlineTransaction(transaction);

        if (response.result == "SUCCESS")
            balanceHeader.innerText = response.payload + " Sylvas";
    }
}

window.walletServerSideSigning = async () => {
    if (localStorage.getItem("keyOnServer") == "true") {
        let username = localStorage.getItem("username");
        let token = localStorage.getItem("token");
    
        let headers = new Headers();
        headers.append("Authorization", "Bearer " + token)
        let url = `http://localhost:4000/query/channels/mychannel/chaincodes/erc1155/selfBalance?tokenId=$ylvas`
    
        var init = {
            method: "GET",
            headers: headers,
        };
    
        let response = await fetch(url, init);
    
        if (response.ok) {
            response = await response.json();
            if (response.result == null) alert("Falha de sincronização");
            else {
                balanceHeader.innerText = response.result + " Sylvas";
            }
        } else {
          console.log("HTTP Error ", response.status);
          return null;
        }
    }
}