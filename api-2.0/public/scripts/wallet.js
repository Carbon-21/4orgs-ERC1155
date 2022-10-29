const client = require("./transaction-handler");


const successFlashMessage =     
    `<div  id="flash-message" class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">`+
        `Consulta realizada com sucesso`+
        `<button id="flash-button" type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
    `</div>`;

const failureFlashMessage =     
    `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
        `Ocorreu um erro na consulta`+
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
    `</div>`

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
            document.getElementById("flash").innerHTML = successFlashMessage;
        } else {
            document.getElementById("flash").innerHTML = failureFlashMessage;
        }
            
    }
}

window.walletServerSideSigning = async () => {
    if (localStorage.getItem("keyOnServer") == "true") {
        document.getElementById("loader").style.display = "flex";
        document.getElementById("flash-button")?.click();
        balanceHeader.innerText = "-";

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

        document.getElementById("loader").style.display = "none";
    
        if (response.ok) {
            response = await response.json();
            if (response.result == null) alert("Falha de sincronização");
            else {
                document.getElementById("flash").innerHTML = successFlashMessage;
                balanceHeader.innerText = response.result + " Sylvas";
            }
        } else {
            document.getElementById("flash").innerHTML = failureFlashMessage;
            console.log("HTTP Error ", response.status);
            return null;
        }
    }
}
