var postMethods = ['Login','Signup','MintNFT']
var getMethods = ['ClientAccountBalance']

async function sendToServer(method, url, body, token) {
    event.preventDefault()
    var headers = new Headers();
    headers.append('Content-Type', 'application/json');
    if (token != null) headers.append('Authorization', 'Bearer ' + token);

    var init = { 
        method: method,
        headers: headers,
    }

    if (method == 'POST') init.body = JSON.stringify(body)

    let response = await fetch(url, init)

    if (response.ok) {
        let json = await response.json()
        return json
    } else {
        console.log("HTTP Error ", response.status)
        return null
    }
}

function wrapRequest(requestType) {
    event.preventDefault()
    let url
    let token
    let username
    let nftId 

    console.log('request type:',requestType)

    switch (requestType) {
        case "Login":
            url = "login"
            username = document.getElementById("username").value
            let password = document.getElementById("password").value
            body = {
                "username": username,
                "password": password
            }
            return [url, body, null]

        case "MintNFT":
            url = "chaincode/channels/mychannel/chaincodes/erc1155"
            let fcn = "Mint" // Switch to MintNFT when it's fully functional
            //let username = document.getElementById("username").value (not necessary since it will be recovered through JWT)
            nftId = document.getElementById("nftId").value
            let phyto = document.getElementById("phyto").value
            let location = document.getElementById("location").value
            let amount = document.getElementById("amount").value
            token = document.getElementById("token").value

            meta = {
                "nftId": nftId,
                "phyto": phyto,
                "location": location
            }

            body = {
               "fcn": fcn,
                "args": ["",nftId, amount, JSON.stringify(meta)]
            }
            return [url, body, token]

        case "ClientAccountBalance":
            nftId = document.getElementById('nftId').value
            url = `chaincode/channels/mychannel/chaincodes/erc1155?fcn=ClientAccountBalance&args=[\"${nftId}\"]`
            token = document.getElementById("token").value
            return [url, null, token]

        default:
            console.log("None")
    }
}

async function sendRequest(requestType) {
    event.preventDefault()
    let [url, body, token] = wrapRequest(requestType)
    let response
    if (postMethods.includes(requestType))
        response = await sendToServer('POST', url, body, token)
    else 
        response = await sendToServer('GET', url, body, token)
    
    console.log("response = ",response)

    switch (requestType) {
        case "Login":
            localStorage.setItem('token', response.token) // store token in local storage
            localStorage.setItem('username', document.getElementById('username').value)
            break
        
        case "ClientAccountBalance":
            if (response.result.ClientAccountBalance == null) alert("Id não encontrado")
            else balanceHeader.innerText = response.result.ClientAccountBalance + ' Sylvas'
            break
    }
}