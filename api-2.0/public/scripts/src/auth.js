
const crypto = require("./crypto-generator");
let username;
let token;

window._getRecaptcha = function () {
  return new Promise((resolve, reject) => {
    if (typeof recaptchaKey !== 'undefined') {
      if (recaptchaKey != void 0) {
        grecaptcha.ready(function () {
          resolve(grecaptcha.execute(recaptchaKey, { action: 'submit' }))
        });
      } else {
        let error = 'Falha no Recpatcha!'
        let element =
          `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
          `${error}` +
          `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
          `</div>`;
        document.getElementById("flash").innerHTML = element;
        reject('Fail recaptcha')
      }
    } else {
      reject('No recaptcha')
    }
  });


}
window.signup = async function () {
  event.preventDefault()
  let recaptchaToken = null
  try {
    recaptchaToken = await _getRecaptcha()
  } catch (error) {
    console.warn(error)
  }
  let email = document.getElementById("email").value.split("/")[0];
  let password = document.getElementById("password").value.split("/")[0];
  let cpf = document.getElementById("cpf").value.split("/")[0];
  let name = document.getElementById("name").value.split("/")[0];
  let salt = document.getElementById("salt").value.split("/")[0];
  let saveKeyOnServer = document.getElementById("saveKeyOnServer").checked; // Boolean that informs whether the user's key is stored on the server or not.

  let cryptoMaterials;
  // Generation of user's private key and CSR in Client-Side Mode
  if (!saveKeyOnServer) cryptoMaterials = await crypto.generateCryptoMaterial(email);

  let hashedPassword = await argon2.hash({ pass: password, salt, hashLen: 32, type: argon2.ArgonType.Argon2id, time: 3, mem: 15625, parallelism: 1 });
  hashedPassword = hashedPassword.hashHex;

  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  let url = `https://${HOST}:${PORT}/signup`;

  var init = {
    method: "POST",
    headers: headers,
  };

  let body = {
    password: hashedPassword,
    cpf: cpf,
    email: email,
    name: name,
    saveKeyOnServer: saveKeyOnServer,
    recaptcha: recaptchaToken
  };

  if (!saveKeyOnServer)
    // If the user chose not to save his private key on the server, the browser generated a CSR that will be sent to the server.
    body.csr = cryptoMaterials.csr;

  init.body = JSON.stringify(body);

  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();
    if (response.success) {
      localStorage.setItem("token", response.token);
      localStorage.setItem("userId", response.userId);
      localStorage.setItem("username", email.split("/")[0]);
      // localStorage.setItem("username", email.slice(0, -1));
      localStorage.setItem("keyOnServer", saveKeyOnServer);

      //if saveKeyOnServer => download cert and private key
      if (response.certificate) {
        if (!saveKeyOnServer) {
          await crypto.downloadCrypto(name, cryptoMaterials.privateKey, "privateKey");
          await crypto.downloadCrypto(name, response.certificate, "certificate");
        }
      }
      window.location.href = "/";
    } else {
      let element =
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `${response.err}` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    }
  } else {
    let responseJson = await response.json();
    let responseText = response.err || ''
    if (response.status >= 400) {
      responseText = responseJson.message
    }
    let element =
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
      `${responseText}` +
      `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
      `</div>`;
    document.getElementById("flash").innerHTML = element;
  }
};

window.login = async function () {
  event.preventDefault();

  const url = `https://${HOST}:${PORT}/login`;

  const password = document.getElementById("password").value.toString().split("/")[0];
  const email = document.getElementById("email").value.split("/")[0]; //removes additional / in the end;
  const salt = document.getElementById("salt").value.split("/")[0];

  let hashedPassword = await argon2.hash({ pass: password, salt, hashLen: 32, type: argon2.ArgonType.Argon2id, time: 3, mem: 15625, parallelism: 1 });

  hashedPassword = hashedPassword.hashHex;

  let headers = new Headers();
  headers.append("Content-Type", "application/json");

  var init = {
    method: "POST",
    headers,
  };

  let body = {
    email,
    password: hashedPassword,
  };

  init.body = JSON.stringify(body);

  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();
    if (response.success) {
      localStorage.setItem("token", response.token);
      localStorage.setItem("userId", response.userId);
      localStorage.setItem("username", email.split("/")[0]);
      localStorage.setItem("keyOnServer", response.keyOnServer);
      window.location.href = "/";
    } else {
      let element =
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `${response.err}` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    }
  }
};
