
window.addEventListener("load", (event) => {
    const keyOnServer = localStorage.getItem("keyOnServer");
    const signingFilesElement = document.getElementById("signing-files");

    // Renders uploading crypto files element conditionally, depending on the value of keyOnServer
    signingFilesElement.hidden = (keyOnServer == "true") ? true : false;
});

/**
 * Sends Request to the server. Returns the server's response
 * @param {*} method POST or GET
 * @param {*} url URL of the server
 * @param {*} body Body to be sent to the server in case of POST
 * @param {*} token Bearer token for authorization
 * @returns Response of the server
 */
const sendToServer = async (method, url, body, token) => {
    //event.preventDefault();
    console.log('entrou sendToServer');
    var headers = new Headers();
    headers.append("Content-Type", "application/json");
    if (token != null) headers.append("Authorization", "Bearer " + token);
  
    var init = {
      method: method,
      headers: headers,
    };
  
    if (method == "POST") init.body = JSON.stringify(body);
  
    let response = await fetch(url, init);
  
    if (response.ok) {
      let json = await response.json();
      return json;
    } else {
      console.log("HTTP Error ", response.status);
      return null;
    }
  }

window.offlineTransaction = async (transaction) => {
    
    // 1. Generate transaction proposal
    const url = "invoke/channels/mychannel/chaincodes/erc1155/generate-proposal";
    const body = {
        username: localStorage.getItem("username"),
        transaction: transaction
    }
    const token = localStorage.getItem("token");
    const response = await sendToServer("POST", url, body, token)
}

window.offlineTransaction({
    fcn: "testando fcn",
    args: ["testando", "args"]
})