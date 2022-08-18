const { Router } = require("express");
const axios = require("axios").default;
const jwt = require("jsonwebtoken");

///// SIGNUP CONTROLLERS /////

exports.getSignup = (req, res, next) => {
  res.render("signup", {
    title: "Signup",
    cssPath: "css/signup.css",
  });
};

exports.postSignup = async (req, res, next) => {
  // Collects data from html signup form

  let username = req.body.username;
  let org = req.body.org;
  let email = req.body.email;
  let password = req.body.password;
  let cpf = req.body.cpf;

  // Groups the data

  let data = {
    username: username,
    org: org,
    email: email,
    password: password,
    cpf: cpf,
  };

  // Data to JSON

  const jsonData = JSON.stringify(data);

  // Initialize request url and headers

  const url = "http://localhost:4000/auth/signup";
  const options = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  // HTTP post request

  axios
    .post(url, jsonData, options)

    .then(function (response) {
      if (response.data.success == true) {
        req.session.token = response.data.token;
        req.session.username = username;
        req.flash("success", "Registrado com sucesso");
        res.redirect("/");
      } else {
        req.flash("error", "Usuario ja existe");
        res.redirect("/signup");
      }
    })

    .catch(function (error) {
      req.flash("error", "Falha no registro");
      res.redirect("/signup");
    });
};

///// LOGIN CONTROLLERS /////

exports.getLogin = (req, res, next) => {
  res.render("login", {
    title: "Login",
    cssPath: "css/login.css",
  });
};

exports.postLogin = async (req, res, next) => {
  // Collects data from html login form

  let username = req.body.username;
  let password = req.body.password;

  // Groups the data

  let data = {
    username: username,
    password: password,
  };

  // Data to JSON

  const jsonData = JSON.stringify(data);

  // Initialize request url and headers

  const url = "http://localhost:4000/auth/login";
  const options = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  // HTTP post request

  axios
    .post(url, jsonData, options)

    .then(function (response) {
      // if the user has successfully logged in, stores user jwt and username info in session

      if (response.data.success == true) {
        req.flash("success", "Logado com sucesso");
        req.session.token = response.data.token;
        req.session.username = username;
        res.redirect("/");
      } else {
        req.flash("error", "Username ou senha incorreta");
        res.redirect("/login");
      }
    })

    .catch(function (error) {
      req.flash("error", "Falha no login");
      res.redirect("/login");
    });
};

///// LOGOUT CONTROLLERS /////

exports.getLogout = (req, res, next) => {
  // jwt and username info stored in session to null

  req.session.token = null;
  req.session.username = null;
  // req.session.destroy();
  res.redirect("/login");
};

///// WALLET CONTROLLERS /////

exports.getWallet = async (req, res, next) => {
  let token = req.session.token;

  const url = `http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155?fcn=ClientAccountBalance&args=[\"$ylvas\"]`;

  const options = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  axios
    .get(url, options)

    .then(function (response) {
      let ftBalance = response.data.result.ClientAccountBalance;
      res.render("wallet", { title: "My Wallet", cssPath: "css/wallet.css", ftBalance });
    })

    .catch(function (error) {
      console.log(error);
      req.flash("error", "Ocorreu um erro");
      res.redirect("/");
    });
};

///// COLLECTION CONTROLLERS /////

exports.getCollection = async (req, res, next) => {
  if (req.session.token) {
    let token = req.session.token;

    const url = `http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155?fcn=ClientAccountTotalBalance&args=[""]`;

    const options = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    axios
      .get(url, options)

      .then(function (response) {
        let balances = response.data.result.balances;
        res.render("collection", {
          title: "My Collection",
          cssPath: "css/collection.css",
          balances,
        });
      })

      .catch(function (error) {
        console.log(error);
        req.flash("error", "Ocorreu um erro");
        res.redirect("/");
      });
  }
};

///// $ILVAS MINT CONTROLLERS /////

exports.getMintFT = (req,res,next) =>{
    res.render('mintFT', {
        title: "Mint FT", 
        cssPath: "../css/mintFT.css"
    });
};

exports.postMintFT = async (req,res,next)=>{
    let username = req.body.username;
    let qty = req.body.qty ;
    let token = req.session.token;
  
    let data ={
      fcn:"Mint",
      args:[username,"$ylvas",qty]
    };
  
    const jsonData = JSON.stringify(data);
  
    const url = "http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155";
  
    const options = {
      method: "POST",
      headers: {
       'Authorization':`Bearer ${token}`,
       'Content-Type': 'application/json',
     },
    };
  
    axios.post(url,jsonData, options)
  
    .then(function (response) {
      req.flash("success", "Mint realizado com sucesso");
      res.redirect("/ft/mint");
    })
  
    .catch(function (error) {
      req.flash("error", "Ocorreu um erro")
      res.redirect("/ft/mint");
    });
};

///// NFT MINT CONTROLLERS /////

exports.getMintNFT = (req,res,next) =>{
    res.render('mintNFT', {
        title: "Mint NFT",
        cssPath: "../css/mintNFT.css"
    });
};

exports.postMintNFT = async (req,res,next)=>{
    let username = req.body.username;
    let qty = req.body.qty ;
    let nftId = req.body.nftId;
    let phyto = req.body.phyto;
    let location = req.body.location;
    let amount = req.body.amount;
    let token = req.session.token;
  
    let meta = {
      nftId: nftId,
      phyto: phyto,
      location: location
    };
  
    let data ={
      fcn:"Mint",
      args:[username, nftId, amount, meta]
    };
  
    const jsonData = JSON.stringify(data);
  
    const url = "http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155";
  
    const options = {
      method: "POST",
      headers: {
       'Authorization':`Bearer ${token}`,
       'Content-Type': 'application/json',
     },
    };
  
    axios.post(url,jsonData, options)
  
    .then(function (response) {
      req.flash("success", "Mint de NFT realizado com sucesso");
      res.redirect("/nft/mint");
    })
  
    .catch(function (error) {
      req.flash("error", "Ocorreu um erro");
      res.redirect("/nft/mint");
    });
};

///// TRANSFER CONTROLLERS /////

exports.getTransfer = (req,res,next) =>{
    res.render('transfer',{
        title: "Transfer",
        cssPath: "css/transfer.css" 
    });
};

exports.postTransfer = async (req,res,next) => {
    let usernameSource = req.session.username;
    let usernameDest = req.body.usernameDest;
    let tokenId = req.body.tokenId;
    let qty = req.body.qty;
    let token = req.session.token;
  
    let data ={
      fcn: "TransferFrom",
      args: [usernameSource, usernameDest, tokenId, qty],
    };
  
    const jsonData = JSON.stringify(data);
  
    const url = "http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155";
  
    const options = {
      method: "POST",
      headers: {
       'Authorization':`Bearer ${token}`,
       'Content-Type': 'application/json',
     },
    };
  
    axios.post(url,jsonData, options)
  
    .then(function (response) {
      req.flash("success", "Transferencia realizada com sucesso");
      res.redirect("/");
    })
  
    .catch(function (error) {
      req.flash("error", "Ocorreu um erro")
      res.redirect("/transfer");
    });
  
}