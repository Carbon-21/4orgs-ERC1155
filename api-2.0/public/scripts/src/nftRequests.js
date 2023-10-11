window.getRequests = async (status) => {
    event.preventDefault();
    let token = localStorage.getItem("token");
    console.log(token);
    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + token);

    // trocar para variaveis de host e port
    let url = `https://localhost:4000/nft/requests?requestStatus=${status}`;

    var init = {
        method: "GET",
        headers: headers
    };

    let response = await fetch(url, init);

    console.log(response)

    if (response.ok) {
        return await response.json();
    } else {
        console.log("HTTP Error ", response.status);
        return null;
    }
}

window.requests = async () => {
    event.preventDefault();
    const status = document.getElementById("statusDropDown").value;
    const search = document.getElementById("searchInput").value;
    console.log(status, search);
    // Recuperar todos os requests na variável requestsList
    let {requests: requestsList} = await getRequests(status);
    
    // Caso haja requests
    if (requestsList) {
        console.log('list', requestsList)
        let element = '';
        const requestsFiltered = requestsList.filter((fil)=>{
            return (
                fil.landOwner.toLowerCase().includes(search.toLowerCase()) ||
                fil.phyto.toLowerCase().includes(search.toLowerCase()) ||
                fil.landArea.toLowerCase().includes(search.toLowerCase())
            )
        });
        if (requestsFiltered.length === 0){
            element +=
                `<div class="d-flex flex-column justify-content-between p-md-1">
                    <center><h2><font color="#5f5f5f">Sem solicitações no momento </font></h2> </center>
                </div>`;
            document.getElementById("requests-show").innerHTML = element;        
        } else {
            requestsFiltered.map((req) => {
                element +=
                    `<a class="request-data" href="/nft/mint?requestId=${req.id}">
                        <div class="info-data">
                            <p><b>Dono da terra: </b> ${req.landOwner}</p>
                        </div>
                        <div class="info-data">
                            <p><b>Fitofisiologia: </b> ${req.phyto}</p>
                            <div class="info-data">
                                <p><b>Área da terra: </b> ${req.landArea} hectares</p>
                            </div>
                        </div>
                    </a>`;
            })
            // Renderizar a cada request carregado
            document.getElementById("requests-show").innerHTML = element;
        }
    } else {
        console.log("HTTP Error ", response.status);
        return null;
    }
}
