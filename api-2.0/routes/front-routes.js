const { Router } = require("express");
const axios = require('axios').default;

// const authController = require("../controllers/auth-crontroller.js");

const router = Router();

const isLoggedIn = (req,res,next)=>{
  if(!req.session.token){
      req.flash("error", "Necessario login");
      res.redirect("/login");
  }
  next();
}

// Signup Routes

router.get("/signup", (req, res) => {
  res.render("signup", { title: "Signup", cssPath: "css/signup.css" });
});

router.post("/signup", async(req,res)=>{

  let username = req.body.username;
  let org = req.body.org;
  let email = req.body.email;
  let password = req.body.password;
  let cpf = req.body.cpf;

  let data ={
    username: username,
    org: org,
    email: email,
    password: password,
    cpf: cpf
  };

  const jsonData = JSON.stringify(data);

  const url = "http://localhost:4000/auth/signup";
  const options = {
    headers: {
     'Content-Type': 'application/json',
   }
  };

  axios.post(url,jsonData,options)

  .then(function (response) {
    console.log(response.data);
    if (response.data.success==true){
      req.flash("success", "Registrado com sucesso");
      res.redirect("/");
    }else{
      req.flash("error", "Usuario ja existe")
      res.redirect("/signup");
    }
  })

  .catch(function (error) {
    req.flash("error", "Falha no registro");
    res.redirect("/signup");
  });

});


// Login Routes

router.get("/login", (req, res) => {
  res.render("login", { title: "Login", cssPath: "css/login.css" });
});

router.post("/login", async(req,res)=>{

  let username = req.body.username;
  let password = req.body.password;

  let data ={
    username:username,
    password: password
  };

  const jsonData = JSON.stringify(data);

  const url = "http://localhost:4000/auth/login";
  const options = {
    headers: {
     'Content-Type': 'application/json',
   }
  };

  axios.post(url,jsonData,options)

  .then(function (response) {
    console.log(response.data);
    if (response.data.success==true){
      req.flash("success", "Logado com sucesso");
      req.session.token = response.data.token;
      res.redirect("/");
    }else{
      req.flash("error", "Username ou senha incorreta")
      res.redirect("/login");
    }
  })

  .catch(function (error) {
    req.flash("error", "Falha no login");
    res.redirect("/login");
  });

});

router.get('/logout', (req, res, next) => {
  req.session.token = null;
  // req.session.destroy();
  res.redirect('/login');
})

// FTs Balance Routes

router.get('/wallet',isLoggedIn, async(req, res)=>{

  let token = req.session.token;

  const url = `http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155?fcn=ClientAccountBalance&args=[\"$ylvas\"]`;

  const options = {
    headers: {
     'Authorization':`Bearer ${token}`,
   },
  };

  await axios.get(url, options)

  .then(function (response) {
    console.log(`Hello theere: ${response.data.result.ClientAccountBalance}`)
    let ftBalance = response.data.result.ClientAccountBalance;
    res.render("wallet", {title: "My Wallet", cssPath: "css/wallet.css", ftBalance});
  })

  .catch(function (error) {
    console.log(error)
    req.flash("error", "Ocorreu um erro")
    res.redirect("/");
  });
});

// NFTs Collection Routes

router.get('/collection', isLoggedIn, function(req, res) {
  res.render('collection', {title: "My Collection", cssPath: "css/collection.css"});
});

// Sylvas Mint Routes

router.get('/ft/mint', isLoggedIn, function(req, res) {
  res.render('mintFT', {title: "Mint FT", cssPath: "../css/mintFT.css"});
});

router.post("/ft", async (req,res)=>{

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

});

// NFT Mint Routes

router.get('/nft/mint',isLoggedIn, function(req, res) {
  res.render('mintNFT', {title: "Mint NFT", cssPath: "../css/mintNFT.css"});
});

router.get('/config', isLoggedIn, function(req, res) {
  res.render('config', {title: "Config", cssPath: "css/config.css"});
});

router.get('/transfer', isLoggedIn, function(req, res) {
  res.render('transfer',{title: "Transfer", cssPath: "css/transfer.css" });
});



module.exports = router;
