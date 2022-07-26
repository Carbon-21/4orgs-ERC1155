const { Router } = require("express");

const router = Router();

router.get('/wallet', (req, res)=>{
  res.render('wallet',{title: "My Wallet", cssPath: "css/wallet.css" });
});

router.get('/mintFT', function(req, res) {
  res.render('mintFT', {title: "Mint FT", cssPath: "css/mintFT.css"});
});

router.get('/collection', function(req, res) {
  res.render('collection', {title: "My Collection", cssPath: "css/collection.css"});
});

router.get('/config', function(req, res) {
  res.render('config', {title: "Config", cssPath: "css/config.css"});
});

router.get('/transfer', function(req, res) {
  res.render('transfer',{title: "Transfer", cssPath: "css/transfer.css" });
});

router.get('/mintNFT', function(req, res) {
  res.render('mintNFT', {title: "Mint NFT", cssPath: "css/mintNFT.css"});
});

module.exports = router;
