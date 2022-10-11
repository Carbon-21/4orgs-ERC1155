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
  const url = "http://localhost:4000/auth/getSalt";
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
  let email = req.body.email.slice(0, -1); //removes additional / in the end;
  let password = req.body.password;
  let cpf = req.body.cpf;
  let name = req.body.name;

  // Groups the data
  let data = {
    email,
    password,
    cpf,
    name,
  };

  // Data to JSON
  const jsonData = JSON.stringify(data);

  // Set request url and headers
  const url = "http://localhost:4000/auth/signup";
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
      res.json({success:true, token:response.data.token})
    })

    // If an error occurs, redirects to the login page and send error message
    .catch(function (err) {
      res.json({success:false, err: err.response.data.message})
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
  const url = "http://localhost:4000/auth/getSalt";
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
  const email = req.body.email.slice(0, -1); //removes additional / in the end
  const password = req.body.password;

  // Groups the data
  let data = {
    email,
    password,
  };

  // Data to JSON
  const jsonData = JSON.stringify(data);

  // Set url and headers
  const url = "http://localhost:4000/auth/login";
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
      res.json({success:true, token:response.data.token})
    })

    // If an error occurs, redirect to the login page and send error message
    .catch(function (err) {
      res.json({success:false, err: err.response.data.message})
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

    // Set url and headers

    const url = "http://localhost:4000/query/channels/mychannel/chaincodes/erc1155/selfBalance?tokenId=$ylvas";
    // const url = `http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155?fcn=ClientAccountTotalBalance&args=[""]`;

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
  }
};

///// $ILVAS MINT CONTROLLERS /////

exports.getMintFT = (req, res, next) => {
  res.render("mintFT", {
    title: "Mint FT",
    cssPath: "../css/mintFT.css",
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
