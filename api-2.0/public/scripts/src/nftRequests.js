const fetch = require("node-fetch");

async function getRequests() {
    console.log("ue")
    // let token = localStorage.getItem("token");
    let headers = new fetch.Headers();
    headers.append("Content-Type", "application/json");
    // headers.append("Authorization", "Bearer " + token);

    // trocar para variaveis de host e port
    let url = 'https://localhost:4000/nft/requests?requestStatus=pending';

    var init = {
        method: "GET",
        headers: headers,
    };

    console.log("ue2")

    let response = await fetch(url, init);

    if (response.ok) {
        response = await response.json();
        console.log(response)
    } else {
        console.log("HTTP Error ", response.status);
        return null;
    }
}

exports.getRequests = getRequests;
