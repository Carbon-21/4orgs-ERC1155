const { Router } = require("express");
const axios = require("axios").default;
const jwt = require("jsonwebtoken");
const frontController = require("../controllers/front-controller.js");
const isLoggedIn = require("../middleware/is-logged-in");
const isAdmin = require("../middleware/is-admin");
const recaptcha = require("../middleware/recaptcha");

const router = Router();

///// SIGNUP ROUTES /////
router.get("/presignup", frontController.getPreSignup);

router.post("/presignup", frontController.postPreSignup);

router.get("/signup", recaptcha.render, frontController.getSignup);

router.post("/signup", recaptcha.verify, frontController.postSignup);

///// LOGIN ROUTES /////
router.get("/prelogin", frontController.getPreLogin);

router.post("/prelogin", frontController.postPreLogin);

router.get("/login", frontController.getLogin);

router.post("/login", frontController.postLogin);

///// LOGOUT ROUTE /////

router.get("/logout", frontController.getLogout);

///// WALLET ROUTE /////

router.get("/wallet", isLoggedIn, frontController.getWallet);

///// COLLECTION ROUTE /////

router.get("/collection", isLoggedIn, frontController.getCollection);

///// MARKETPLACE ROUTE /////

router.get("/marketplace", isLoggedIn, frontController.getMarketplace);

///// $ILVAS MINT ROUTES /////

router.get("/ft/mint", isLoggedIn, isAdmin, frontController.getMintFT);

router.get("/ft/mintFromNFT", isLoggedIn, isAdmin, frontController.getMintFromNFT);

///// NFT MINT ROUTES /////

router.get("/nft/mint", isLoggedIn, isAdmin, frontController.getMintNFT);

router.get("/nft/requests", isLoggedIn, isAdmin, frontController.getMintNFTRequests);

///// TRANSFER ROUTES /////

router.get("/transfer", isLoggedIn, frontController.getTransfer);

///// TRANSPARENCY LOGS CONTROLLERS /////
router.get("/logs", frontController.getLogs);

module.exports = router;
