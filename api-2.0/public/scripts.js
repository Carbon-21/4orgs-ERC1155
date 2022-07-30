function sendPost(url, body, token) {
    let request = new XMLHttpRequest()
    request.open("POST", url, true)
    request.setRequestHeader("Content-Type", "application/json")
    request.setRequestHeader("Authorization", "Bearer " + token)
    request.send(JSON.stringify(body))

    request.onload = function() {
        console.log(this.responseText)
    }

    return request.responseText
}

async function sendGet(url, token) {
    var headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);

    var init = { 
        method: 'GET',
        headers: headers
    }

    let response = await fetch(url, init)

    if (response.ok) {
        let json = await response.json()
        return json
    } else {
        console.log("HTTP Error ", response.status)
        return null
    }
}


//Attempt to send GET in pure JavaScript. Failed 
/*function sendGet(url, body, token) {
    let request = new XMLHttpRequest()
    request.open("GET", url, true)
    request.setRequestHeader("Content-Type", "application/json")
    request.setRequestHeader("Authorization", "Bearer " + token)
    request.send(JSON.stringify(body))

    request.onload = function() {
        console.log(this.responseText)
        return this.responseText
    }

    //return request.responseText
}*/

async function sendRequest(requestType){
    event.preventDefault()
    let url
    let token 
    console.log('request type:',requestType)
    switch (requestType) {
        case "MintNFT":
            url = "chaincode/channels/mychannel/chaincodes/erc1155"
            let fcn = "Mint" // Switch to MintNFT when it's fully functional
            //let username = document.getElementById("username").value (not necessary since it will be recovered through JWT)
            let nftId = document.getElementById("nftId").value
            let phyto = document.getElementById("phyto").value
            let location = document.getElementById("location").value
            let amount = document.getElementById("amount").value
            console.log("typeof amount",typeof amount)
            token = document.getElementById("token").value

            meta = {
                "nftId": nftId,
                "phyto": phyto,
                "location": location
            }

            body = {
               "fcn": fcn,
                //"username": username,
                //"nftId": nftId,
                //"phyto": phyto,
                //"location": location,
                "args": ["",nftId, amount, JSON.stringify(meta)] //TODO: add value to be minted on the webpage 
            }
            console.log("stringify=\n",JSON.stringify(body))
            sendPost(url, body, token)
            break

        case "ClientAccountBalance":
            url = "chaincode/channels/mychannel/chaincodes/erc1155?fcn=ClientAccountBalance&args=[\"NFT\"]"
            token = document.getElementById("token").value
            let response = await sendGet(url, token)
            console.log("response = ",response)
            //document.getElementById("balanceHeader").value = response.result.ClientAccountBalance
            balanceHeader.innerText = response.result.ClientAccountBalance + " Sylvas"
            break
        default:
            console.log("None")
    }
}