const crypto = require("./crypto-generator");

let username;
let token;

window.signup = async function () {

    event.preventDefault();
    
    let email = document.getElementById("email").value.split("/")[0];
    let password = document.getElementById("password").value;
    let cpf = document.getElementById("cpf").value;
    let name = document.getElementById("name").value;
    let salt = document.getElementById("salt").value;
    let saveKeyOnServer = document.getElementById("saveKeyOnServer").checked;
    
    let cryptoMaterials;
    // Generation of user's private key and CSR in Client-Side Mode
    if (!saveKeyOnServer)
        cryptoMaterials = await crypto.generateCryptoMaterial(email);

    password = await hashPassword(password,salt)

    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    let url = "http://localhost:4000/signup";

    var init = {
        method: "POST",
        headers: headers,
    };

    let body = {
        password: password,
        cpf: cpf,
        email: email,
        name: name,
        saveKeyOnServer: saveKeyOnServer
    };

    if (!saveKeyOnServer)
        body.csr = cryptoMaterials.csr;

    init.body = JSON.stringify(body);

    let response = await fetch(url, init);

    if (response.ok) {
        response = await response.json();
        if (response.success) {
            localStorage.setItem("token", response.token);
            localStorage.setItem("username", email.slice(0, -1));
            localStorage.setItem("keyOnServer", saveKeyOnServer);
            console.log('response',response);
            if (response.certificate) {
                if (!saveKeyOnServer)
                    await crypto.downloadCrypto(name, cryptoMaterials.privateKey, 'privateKey');
                await crypto.downloadCrypto(name, response.certificate, 'certificate');
            }
            window.location.href = '/';
        } else {
            let element =     
                `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
                    `${response.err}`+
                    `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
                `</div>`
            document.getElementById("flash").innerHTML = element;
        }
    } else {
        console.log("HTTP Error ", response.status);
        return null;
    }

}

window.login = async function () {

    event.preventDefault();

    let password = document.getElementById("password").value;
    let email= document.getElementById("email").value;
    let salt= document.getElementById("salt").value;

    password = await hashPassword(password,salt)

    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    let url = "http://localhost:4000/login";

    var init = {
        method: "POST",
        headers: headers,
    };

    let body = {
        email: email,
        password: password,
    };

    init.body = JSON.stringify(body);

    let response = await fetch(url, init);

    if (response.ok) {
        response = await response.json();
        if (response.success) {
            localStorage.setItem("token", response.token);
            localStorage.setItem("username", email.split("/")[0]);
            localStorage.setItem("keyOnServer", response.keyOnServer);
            window.location.href = '/';
        } else {
            let element =     
            `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
                `${response.err}`+
                `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
            `</div>`
            document.getElementById("flash").innerHTML = element;
        }
    } else {
      console.log("HTTP Error ", response.status);
      return null;
    }

}