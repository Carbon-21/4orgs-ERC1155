const { Router } = require("express");

const router = Router();

router.get('/balance', (req, res)=>{
  res.render('balance',{title: "Balance", cssPath: "css/balance.css" });
});

router.get('/mint', function(req, res) {
  res.render('mint', {title: "Mint", cssPath: "css/mint.css"});
});

router.get('/config', function(req, res) {
  res.render('config', {title: "Config", cssPath: "css/config.css"});
});

router.get('/transfer', function(req, res) {
  res.render('mint',{title: "Transfer", cssPath: "" });
});

module.exports = router;
