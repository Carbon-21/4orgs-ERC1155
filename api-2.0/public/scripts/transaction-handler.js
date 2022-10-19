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

export const offlineTransaction = async (privateKey, certificate, transaction) => {
    
    // 1. Generate transaction proposal
    const url = "invoke/channels/mychannel/chaincodes/erc1155/generate-proposal";
    const body = {
        username: localStorage.getItem("username"),
        transaction: transaction,
        certificate: certificate
    };
    const token = localStorage.getItem("token");
    const proposalResponse = await sendToServer("POST", url, body, token);
}