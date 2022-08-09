const { Router } = require("express");
const axios = require('axios').default;

const router = Router();

// Middleware: used to protect some pages checking if the user is logged in. If not, redirects to login page.

const isLoggedIn = async (req,res,next)=>{
  if(!req.session.token){
      req.flash("error", "Necessario login");
      res.redirect("/login");
  }else next();
}

// Signup Routes

router.get("/signup", (req, res) => {
  res.render("signup", { title: "Signup", cssPath: "css/signup.css" });
});

router.post("/signup", async(req,res)=>{

  // Collects data from html signup form

  let username = req.body.username;
  let org = req.body.org;
  let email = req.body.email;
  let password = req.body.password;
  let cpf = req.body.cpf;

  // Groups the data

  let data ={
    username: username,
    org: org,
    email: email,
    password: password,
    cpf: cpf
  };

  // Data to JSON

  const jsonData = JSON.stringify(data);

  // Initilize request url and headers

  const url = "http://localhost:4000/auth/signup";
  const options = {
    headers: {
     'Content-Type': 'application/json',
   }
  };

  // HTTP post request

  axios.post(url,jsonData,options)

  .then(function (response) {
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

  // Collects data from html login form

  let username = req.body.username;
  let password = req.body.password;

  // Groups the data

  let data ={
    username:username,
    password: password
  };

  // Data to JSON

  const jsonData = JSON.stringify(data);

  // Initilize request url and headers

  const url = "http://localhost:4000/auth/login";
  const options = {
    headers: {
     'Content-Type': 'application/json',
   }
  };

  // HTTP post request

  axios.post(url,jsonData,options)

  .then(function (response) {

    // if the user has successfully logged in, stores user jwt and username info in session

    if (response.data.success==true){
      req.flash("success", "Logado com sucesso");
      req.session.token = response.data.token;
      req.session.username = username;
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

// Logout route: jwt and username info stored in session to null

router.get('/logout', (req, res, next) => {
  req.session.token = null;
  req.session.username = null;
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

    axios.get(url, options)

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

  if (req.session.token) {
    let token = req.session.token;

    const url = `http://localhost:4000/chaincode/channels/mychannel/chaincodes/erc1155?fcn=ClientAccountTotalBalance&args=[""]`;

    const options = {
      headers: {
      'Authorization':`Bearer ${token}`,
    },
    };

    axios.get(url, options)

    .then(function (response) {
      let balances = response.data.result.balances;
      res.render("collection", {title: "My Collection", cssPath: "css/collection.css", balances});
    })

    .catch(function (error) {
      console.log(error)
      req.flash("error", "Ocorreu um erro")
      res.redirect("/");
    });

  }

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

router.post("/nft", isLoggedIn, async (req,res)=>{

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
    req.flash("error", "Ocorreu um erro")
    res.redirect("/ft/mint");
  });

});

router.get('/config', isLoggedIn, function(req, res) {
  res.render('config', {title: "Config", cssPath: "css/config.css"});
});

router.get('/transfer', isLoggedIn, function(req, res) {
  res.render('transfer',{title: "Transfer", cssPath: "css/transfer.css" });
});

router.post('/transfer', isLoggedIn, function(req, res) {
  
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

});


module.exports = router;
