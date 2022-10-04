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
            alert(`Registrado com Sucesso! ${localStorage.token} ${localStorage.username}`);
            window.location.href = '/';
        } else {
          alert(`Falha no registro!`);
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
            alert(`Logado com Sucesso! ${localStorage.token} ${localStorage.username}`);
            window.location.href = '/';
        } else {
          alert(`A PQP Falha no Login!`);
        }
    } else {
      console.log("HTTP Error ", response.status);
      return null;
    }

}