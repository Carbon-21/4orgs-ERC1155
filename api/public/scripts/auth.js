let username;
let token;

async function signup() {
  event.preventDefault();

  const url = "http://localhost:4000/signup";

  const email = document.getElementById("email").value.slice(0, -1); //removes additional / in the end;
  const password = document.getElementById("password").value;
  const cpf = document.getElementById("cpf").value;
  const name = document.getElementById("name").value;
  const salt = document.getElementById("salt").value.slice(0, -1);

  let hashedPassword = await argon2.hash({ pass: password, salt, hashLen: 32, type: argon2.ArgonType.Argon2id, time: 3, mem: 15625, parallelism: 1 });
  hashedPassword = hashedPassword.hashHex;

  let headers = new Headers();
  headers.append("Content-Type", "application/json");

  var init = {
    method: "POST",
    headers: headers,
  };

  const body = {
    password: hashedPassword,
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
      localStorage.setItem("username", email);
      window.location.href = "/";
    } else {
      element =
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `${response.err}` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    }
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }
}

async function login() {
  event.preventDefault();

  const url = "http://localhost:4000/login";

  const password = document.getElementById("password").value;
  const email = document.getElementById("email").value.slice(0, -1); //removes additional / in the end;
  const salt = document.getElementById("salt").value.slice(0, -1);

  let hashedPassword = await argon2.hash({ pass: password, salt, hashLen: 32, type: argon2.ArgonType.Argon2id, time: 3, mem: 15625, parallelism: 1 });

  hashedPassword = hashedPassword.hashHex;

  let headers = new Headers();
  headers.append("Content-Type", "application/json");

  var init = {
    method: "POST",
    headers,
  };

  body = {
    email,
    password: hashedPassword,
  };
  init.body = JSON.stringify(body);

  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();
    if (response.success) {
      localStorage.setItem("token", response.token);
      localStorage.setItem("username", email);
      window.location.href = "/";
    } else {
      element =
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `${response.err}` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    }
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }
}
