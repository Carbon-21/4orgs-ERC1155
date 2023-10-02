window.getRequests = async () => {
    event.preventDefault();
    let token = localStorage.getItem("token");
    console.log(token);
    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + token);

    // trocar para variaveis de host e port
    let url = 'https://localhost:4000/nft/requests?requestStatus=pending';

    var init = {
        method: "GET",
        headers: headers
    };

    let response = await fetch(url, init);
    
    console.log(response);
    console.log(response.body);
    console.log(response.json());

    if (response.ok) {
        return await response.json();
    } else {
        console.log("HTTP Error ", response.status);
        return null;
    }
}
