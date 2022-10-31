async function wallet(){

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