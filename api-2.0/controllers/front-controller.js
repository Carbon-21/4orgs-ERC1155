const { Router } = require("express");
const axios = require("axios").default;
const jwt = require("jsonwebtoken");

///// SIGNUP CONTROLLERS /////
exports.getPreSignup = (req, res, next) => {
  res.render("presignup", {
    title: "Registrar",
    cssPath: "css/prelogin.css",
  });
};

exports.postPreSignup = async (req, res, next) => {
  // Collects data from html login form
  const email = req.body.username;

  // Groups the data
  const data = {
    email,
    isSignUp: true,
  };

  // Data to JSON
  const jsonData = JSON.stringify(data);

  // Set url and headers
  const url = `http://${process.env.HOST}:${process.env.PORT}/auth/getSalt`;
  const options = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  // HTTP POST request
  axios
    .post(url, jsonData, options)
    .then(function (response) {
      const salt = response.data.salt;
      res.redirect(`/signup?email=${email}&salt=${salt}`);
    })

    // If an error occurs, redirect to the login page and send error message
    .catch(function (err) {
      req.flash("error", err.response.data.message);
      res.redirect("/presignup");
    });
};

exports.getSignup = (req, res, next) => {
  //get salt and email from URL parameters
  const salt = req.query.salt;
  const email = req.query.email;

  //pass salt and email forward (EJS)
  res.render("signup", {
    title: "Registrar",
    cssPath: "css/signup.css",
    salt,
    email,
  });
};

exports.postSignup = async (req, res, next) => {
  // Collects data from html signup form
  let email = req.body.email;
  let password = req.body.password;
  let cpf = req.body.cpf;
  let name = req.body.name;
  let saveKeyOnServer = req.body.saveKeyOnServer;

  // Groups the data
  let data = {
    email,
    password,
    cpf,
    name,
    saveKeyOnServer
  };

  if (!saveKeyOnServer) data.csr = req.body.csr;

  // Data to JSON
  const jsonData = JSON.stringify(data);

  // Set request url and headers
  const url = `http://${process.env.HOST}:${process.env.PORT}/auth/signup`;
  const options = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  // HTTP POST request

  axios
    .post(url, jsonData, options)

    .then(function (response) {
      // if the user has successfully registered, store user jwt and username info in session
      req.session.username = email;
      req.session.role = JSON.parse(atob(response.data.token.split(".")[1])).role;
      res.json({success: true, token:response.data.token, certificate: response.data.certificate})
    })

    // If an error occurs, redirects to the login page and send error message
    .catch(function (err) {
      res.json({ success: false, err: err.response.data.message });
    });
};

///// LOGIN CONTROLLERS /////
exports.getPreLogin = (req, res, next) => {
  res.render("prelogin", {
    title: "Entrar",
    cssPath: "css/prelogin.css",
  });
};

exports.postPreLogin = async (req, res, next) => {
  // Collects data from html login form
  const email = req.body.username;

  // Groups the data
  const data = {
    email,
    isSignUp: false,
  };

  // Data to JSON
  const jsonData = JSON.stringify(data);

  // Set url and headers
  const url = `http://${process.env.HOST}:${process.env.PORT}/auth/getSalt`;
  const options = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  // HTTP POST request
  axios
    .post(url, jsonData, options)
    .then(function (response) {
      const salt = response.data.salt;
      res.redirect(`/login?email=${email}&salt=${salt}`);
    })

    // If an error occurs, redirect to the login page and send error message
    .catch(function (err) {
      req.flash("error", err.response.data.message);
      res.redirect("/prelogin");
    });
};

exports.getLogin = (req, res, next) => {
  //get salt and email from URL parameters
  const salt = req.query.salt;
  const email = req.query.email;

  //pass salt and email forward (EJS)
  res.render("login", {
    title: "Entrar",
    cssPath: "css/login.css",
    salt,
    email,
  });
};

exports.postLogin = async (req, res, next) => {
  // Collects data from html login form
  const email = req.body.email;
  const password = req.body.password;

  // Groups the data
  let data = {
    email,
    password,
  };

  // Data to JSON
  const jsonData = JSON.stringify(data);

  // Set url and headers
  const url = `http://${process.env.HOST}:${process.env.PORT}/auth/login`;
  const options = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  // HTTP POST request
  axios
    .post(url, jsonData, options)
    .then(function (response) {
      // if the user has successfully logged in, stores user jwt and username info in session
      req.session.username = email;
      req.session.role = JSON.parse(atob(response.data.token.split(".")[1])).role;
      res.json({success: true, token: response.data.token, keyOnServer: response.data.keyOnServer})
    })

    // If an error occurs, redirect to the login page and send error message
    .catch(function (err) {
      res.json({ success: false, err: err.response.data.message });
    });
};

///// LOGOUT CONTROLLERS /////

exports.getLogout = (req, res, next) => {
  // jwt and username info stored in session to null

  req.session.token = null;
  req.session.username = null;
  // req.session.destroy();
  res.redirect("/");
};

///// WALLET CONTROLLERS /////

exports.getWallet = async (req, res, next) => {
  res.render("wallet", {
    title: "My Wallet",
    cssPath: "css/wallet.css",
  });
};

///// COLLECTION CONTROLLERS /////

exports.getCollection = async (req, res, next) => {
  if (req.session.token) {
    let token = req.session.token;
    // NOTE: para testes e exemplificando recuperacao de metadados por tokenIds
    let tokenId = "a";

    // Set url and headers

    const url = `http://${process.env.HOST}:${process.env.PORT}/query/channels/mychannel/chaincodes/erc1155/selfBalance?tokenId=\$ylvas`;
    const options = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    // HTTP GET request

    axios
      .get(url, options)

      // If successful, return user NFT balance

      .then(function (response) {
        let balances = response.data.result;
        res.render("collection", {
          title: "My Collection",
          cssPath: "css/collection.css",
          balances,
        });
      })

      // If an error occurs, redirect to the homepage and send error message

      // .catch(function (error) {
      //   console.log(error);
      //   req.flash("error", "Ocorreu um erro");
      //   res.redirect("/");
      // });
      .catch(function (err) {
        req.flash("error", err.response.data.message);
        res.redirect("/");
      });

    axios
      .post("http://localhost:4000/meta/getMetadata", JSON.stringify({ tokenId: tokenId, token }), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then(function (response) {
        let metadata = response.data.result;
        console.log("Metadados recuperados: \n" + JSON.stringify(metadata));
      })
      .catch(function (err) {});
  }
};

///// $ILVAS MINT CONTROLLERS /////

exports.getMintFT = (req, res, next) => {
  res.render("mintFT", {
    title: "Mint FT",
    cssPath: "../css/mintFT.css",
  });
};

exports.getMintFromNFT = (req, res, next) => {
  res.render("mintFromNFT", {
    title: "Mint From NFT",
    cssPath: "../css/mintFromNFT.css",
  });
};


///// NFT MINT CONTROLLERS /////

exports.getMintNFT = (req, res, next) => {
  res.render("mintNFT", {
    title: "Mint NFT",
    cssPath: "../css/mintNFT.css",
  });
};

///// TRANSFER CONTROLLERS /////

exports.getTransfer = (req, res, next) => {
  res.render("transfer", {
    title: "Transfer",
    cssPath: "css/transfer.css",
  });
};
