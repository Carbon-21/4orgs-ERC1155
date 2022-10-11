const { hashSync } = require("bcryptjs");

let username;
let token;

async function signup(){

    event.preventDefault();
    
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let cpf = document.getElementById("cpf").value;
    let name = document.getElementById("name").value;

    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    let url = "http://localhost:4000/signup";

    var init = {
        method: "POST",
        headers: headers,
    };

    body = {
        password: password,
        cpf: cpf,
        email: email,
        name: name,
    };

    init.body = JSON.stringify(body);

    let response = await fetch(url, init);

    if (response.ok) {
        response = await response.json();
        if (response.success) {
            localStorage.setItem("token", response.token);
            localStorage.setItem("username", email.slice(0, -1));
            window.location.href = '/';
        } else {
            element =     
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

async function login(){

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

    body = {
        email: email,
        password: password,
    };

    init.body = JSON.stringify(body);

    let response = await fetch(url, init);

    if (response.ok) {
        response = await response.json();
        if (response.success) {
            localStorage.setItem("token", response.token);
            localStorage.setItem("username", email.slice(0, -1));
            window.location.href = '/';
        } else {
            element =     
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