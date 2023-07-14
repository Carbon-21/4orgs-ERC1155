const { Router } = require("express");
const axios = require("axios").default;
const jwt = require("jsonwebtoken");
const logger = require("../util/logger");
const HttpError = require("../util/http-error");
const models = require("../util/sequelize");

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
  const url = `https://${process.env.HOST}:${process.env.PORT}/auth/getSalt`;
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
      console.error(err)
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
    recaptcha: res.recaptcha
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
    saveKeyOnServer,
  };

  if (!saveKeyOnServer) data.csr = req.body.csr;

  // Data to JSON
  const jsonData = JSON.stringify(data);

  // Set request url and headers
  const url = `https://${process.env.HOST}:${process.env.PORT}/auth/signup`;
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
      res.json({ success: true, token: response.data.token, certificate: response.data.certificate });
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
  const url = `https://${process.env.HOST}:${process.env.PORT}/auth/getSalt`;
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
  const url = `https://${process.env.HOST}:${process.env.PORT}/auth/login`;
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
      res.json({ success: true, token: response.data.token, keyOnServer: response.data.keyOnServer });
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
  res.render("collection", {
    title: "My Collection",
    cssPath: "css/collection.css",
  });
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

///// NFT REQUESTS CONTROLLERS /////

exports.getNftRequests = async (req, res, next) => {
  const { request_status } = req.query;

  try {
    if (!request_status) {
      return next(new HttpError(400, "request_status is necessary."));
    }

    requests = await models.nftRequests.findAll({
      where: { request_status },
    });
    return res.status(200).json({
      requests,
    });
  } catch (err) {
    logger.error(err);
    return next(new HttpError(404));
  }
};

exports.responseNftRequest = async (req, res, next) => {
  const { id } = req.params;
  const { aprove, adminNotes } = req.body;

  try {
    if (!id) {
      return next(new HttpError(400, "Id is necessary."));
    }

    const requestStatus = aprove === true ? 'accepted' : 'rejected';
    request = await models.nftRequests.update({
      requestStatus,
      adminNotes,
    }, {
      where: { id },
    });

    return res.status(200).json({
      request,
    });
  } catch (err) {
    logger.error(err);
    return next(new HttpError(400));
  }
};

///// TRANSFER CONTROLLERS /////

exports.getTransfer = (req, res, next) => {
  res.render("transfer", {
    title: "Transfer",
    cssPath: "css/transfer.css",
  });
};

///// TRANSPARENCY LOGS CONTROLLERS /////

exports.getLogs = (req, res, next) => {
  res.render("logs", {
    title: "Logs Transparentes",
    cssPath: "css/logs.css",
  });
};
