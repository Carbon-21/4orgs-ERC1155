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
  let password = req.body.hashedPassword;
  let cpf = req.body.cpf;
  let name = req.body.name;
  // const email = req.body.

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
      req.session.token = response.data.token;
      req.session.username = email;
      req.flash("success", "Registrado com sucesso");
      res.redirect("/");
    })

    // If an error occurs, redirects to the login page and send error message
    .catch(function (err) {
      req.flash("error", err.response.data.message);
      res.redirect("/presignup");
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
  // const argon2 = require("./public/scripts/argon2-bundled.min.js")

// console.time('doSomething');
// argon2.hash({ pass: "234", salt: "fe3d29e07ed7b249a55da6dd578d18e1", hashLen: 16, type:argon2.ArgonType.Argon2id, time: 2, mem:6024, parallelism: 3 }).then(console.timeEnd('doSomething'))
 
// const argon2 = require("argon2")

// console.time('doSomething');


// try {
//   const hash = await argon2.hash("123")
//   // const res = await argon2.hash("234", {salt: Buffer.from("fe3d29e07ed7b249a55da6dd578d18e1","hex"), hashLength: 16, timeCost: 2, memoryCost:6024, parallelism: 3 }).
//   // console.log(res);
//   // console.timeEnd('doSomething');
// } catch (error) {

// }
//   //get salt and email from URL parameters
//   const salt = req.query.salt;
//   const email = req.query.email;

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
  const password = req.body.hashedPassword;

  console.log("password!!!",password)

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
      req.flash("success", "Boas-vindas");
      req.session.token = response.data.token;
      req.session.username = email;
      res.redirect("/");
    })

    // If an error occurs, redirect to the login page and send error message
    .catch(function (err) {
      req.flash("error", err.response.data.message);
      res.redirect("/prelogin");
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
  let token = req.session.token;

  // Set url and headers

  const url = `http://localhost:4000/query/channels/mychannel/chaincodes/erc1155/selfBalance?tokenId=$ylvas`;
  // const url = `http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155?fcn=SelfBalance&args=[\"$ylvas\"]`;

  const options = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // HTTP GET request

  axios
    .get(url, options)

    // If successful, return user Sylvas balance

    .then(function (response) {
      let ftBalance = response.data.result;
      res.render("wallet", {
        title: "My Wallet",
        cssPath: "css/wallet.css",
        ftBalance,
      });
    })

    // If an error occurs, redirect to the homepage and send error message

    .catch(function (err) {
      req.flash("error", err.response.data.message);
      res.redirect("/");
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

exports.postMintFT = async (req, res, next) => {
  // Collects data from html Sylvas Mint form
  let username = req.body.username;
  let qty = req.body.qty;
  let token = req.session.token;

  // Groups the data

  let data = {
    tokenId: "$ylvas",
    tokenAmount: qty,
    tokenReceiver: username,
  };

  // Data to JSON

  const jsonData = JSON.stringify(data);

  // Set url and headers

  const url = "http://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/mint";
  // const url = "http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155";

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // HTTP POST request

  axios
    .post(url, jsonData, options)

    // If successful, mint the Sylvas amount to the specified user and send success message

    .then(function (response) {
      req.flash("success", "Emissão de $ylvas realizada com sucesso");
      res.redirect("/ft/mint");
    })

    // If an error occurs, redirect to  the mint page and send error message

    // .catch(function (error) {
    //   req.flash("error", "Ocorreu um erro");
    //   res.redirect("/ft/mint");
    // });
    .catch(function (err) {
      req.flash("error", err.response.data.message);
      res.redirect("/ft/mint");
    });
};

///// NFT MINT CONTROLLERS /////

exports.getMintNFT = (req, res, next) => {
  res.render("mintNFT", {
    title: "Mint NFT",
    cssPath: "../css/mintNFT.css",
  });
};

exports.postMintNFT = async (req, res, next) => {
  // Collects data from html NFT Mint form
  let username = req.body.username;
  let qty = req.body.amount;
  let nftId = req.body.nftId;
  let phyto = req.body.phyto;
  let location = req.body.location;
  let token = req.session.token;

  // Groups the NFT metadata

  let meta = {
    nftId: nftId,
    phyto: phyto,
    location: location,
  };

  // Groups the data

  // let data = {
  //   fcn: "Mint",
  //   args: [username, nftId, amount, meta],
  // };
  let data = {
    tokenId: nftId,
    tokenAmount: qty,
    tokenReceiver: username,
  };

  // Data to JSON

  const jsonData = JSON.stringify(data);

  // Set url and headers
  const url = "http://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/mint";
  // const url = "http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155";

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // HTTP POST request

  axios
    .post(url, jsonData, options)

    // If successful, mint NFT to the specified user and send success message

    .then(function (response) {
      req.flash("success", "Emissão de NFT realizada com sucesso");
      res.redirect("/nft/mint");
    })

    // If an error occurs, redirect to the NFT Mint page and send error message

    // .catch(function (error) {
    //   req.flash("error", "Ocorreu um erro");
    //   res.redirect("/nft/mint");
    // });
    .catch(function (err) {
      req.flash("error", err.response.data.message);
      res.redirect("/nft/mint");
    });
};

///// TRANSFER CONTROLLERS /////

exports.getTransfer = (req, res, next) => {
  res.render("transfer", {
    title: "Transfer",
    cssPath: "css/transfer.css",
  });
};

exports.postTransfer = async (req, res, next) => {
  // Collects data from html Transfer form
  let usernameDest = req.body.usernameDest;
  let tokenId = req.body.tokenId;
  let qty = req.body.qty;
  let usernameSource = req.session.username;
  let token = req.session.token;

  // Groups the data

  // let data = {
  //   fcn: "TransferFrom",
  //   args: [usernameSource, usernameDest, tokenId, qty],
  // };
  let data = {
    tokenId,
    tokenAmount: qty,
    tokenSender: usernameSource,
    tokenReceiver: usernameDest,
  };

  // Data to JSON

  const jsonData = JSON.stringify(data);

  // Set url and headers

  const url = "http://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/transfer";
  // const url = "http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155";

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // HTTP POST request

  axios
    .post(url, jsonData, options)

    // If successful, transfer the tokens amount to the specified user and send success message

    .then(function (response) {
      req.flash("success", "Transferência realizada com sucesso");
      res.redirect("/");
    })

    // If an error occurs, redirect to the transfer page and send error message

    // .catch(function (error) {
    //   req.flash("error", "Ocorreu um erro");
    //   res.redirect("/transfer");
    // });
    .catch(function (err) {
      req.flash("error", err.response.data.message);
      res.redirect("/transfer");
    });
};
