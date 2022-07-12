const { Router } = require("express");
// const { body } = require("express-validator");

// const { validateAll } = require("../util/validation");
// const checkAuth = require("../middleware/check-auth");
// const authController = require("../controllers/auth-crontroller.js");

const router = Router();

router.get('/signup', (req, res)=>{
  res.render('signup',{title: "Signup", cssPath: "css/signup.css" });
});

router.get('/login', (req, res)=>{
  res.render('login', {title: "Login", cssPath: "css/login.css"});
});

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
  res.render('mint',{title: "Transferências", cssPath: "" });
});

// router.use(checkAuth);

module.exports = router;
