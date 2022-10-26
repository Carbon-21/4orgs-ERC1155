const client = require("./transaction-handler");


window.walletClientSideSigning = async () => {
    if (localStorage.getItem("keyOnServer") == "false") {
        document.getElementById("signing-files").style.display = "none";
        document.getElementById("loader").style.display = "flex";
        document.getElementById("flash-button")?.click();
        balanceHeader.innerText = "-";

        event.preventDefault();

        const transaction = {
            chaincodeId: 'erc1155',
            channelId: 'mychannel',
            fcn: "SelfBalance",
            args: ["$ylvas"]
        };

        let response = await client.offlineTransaction(transaction);
        
        document.getElementById("signing-files").style.display = "flex";
        document.getElementById("loader").style.display = "none";
        
        if (response.result == "SUCCESS") {
            balanceHeader.innerText = response.payload + " Sylvas";
            let element =     
            `<div  id="flash-message" class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">`+
                `Consulta realizada com sucesso`+
                `<button id="flash-button" type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
            `</div>`
            document.getElementById("flash").innerHTML = element;
        } else {
            let element =     
            `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
                `Ocorreu um erro na consulta`+
                `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
            `</div>`
            document.getElementById("flash").innerHTML = element;
        }
            
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
