async function collection(){

    let username = localStorage.getItem("username");
    let token = localStorage.getItem("token");

    let headers = new Headers();
    headers.append("Authorization", "Bearer " + token)
    let url = `http://${process.env.HOST}:${process.env.PORT}/chaincode/channels/mychannel/chaincodes/erc1155?fcn=ClientAccountTotalBalance&args=[""]`;

    var init = {
        method: "GET",
        headers: headers,
    };

    let response = await fetch(url, init);

    if (response.ok) {
        response = await response.json();
      if (response.result.message == "NO_TOKENS") alert("Erro: Não foram identificados NFTs");
      else if (response.result.message == "success") {
        let balances = response.result.balances;
        let element;
        //element = '<div class="d-flex flex-column justify-content-between p-md-1">'
        //for (var i = 0; i < Object.keys(response.result.balances).length; i++) {
        for (var key in balances) {
          element += 
          '<div class="card shadow-lg mt-3">' +
            '<div class="card-body flex-column">' +
              '<div class="d-flex justify-content-between p-md-1">' +
                  '<div class="d-flex flex-row">' +
                    '<div class="align-self-center">' +
                      '<i class="fa-solid fa-tree fa-4x tree-icon"></i>' +
                    '</div>' +
                    '<div>' +
                      '<h4>NFT</h4>' +
                      `<p class="mb-0">id: ${key}</p>` +
                      `<p class="mb-0">valor: ${balances[key]}</p>` +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
              
        }
        document.getElementById("nft-showroom").innerHTML = element;
      }
    } else {
      console.log("HTTP Error ", response.status);
      return null;
    }

}