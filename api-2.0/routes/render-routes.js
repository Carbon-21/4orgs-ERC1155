const { Router } = require("express");

const router = Router();

router.get('/wallet', (req, res)=>{
  res.render('wallet',{title: "My Wallet", cssPath: "css/wallet.css" });
});

router.get('/mint', function(req, res) {
  res.render('mint', {title: "Mint", cssPath: "css/mint.css"});
});

router.get('/collection', function(req, res) {
  res.render('collection', {title: "My Collection", cssPath: "css/collection.css"});
});

router.get('/config', function(req, res) {
  res.render('config', {title: "Config", cssPath: "css/config.css"});
});

router.get('/transfer', function(req, res) {
  res.render('mint',{title: "Transfer", cssPath: "" });
});

module.exports = router;
