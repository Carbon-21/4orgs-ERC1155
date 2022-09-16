const { Router } = require("express");
const axios = require("axios").default;
const jwt = require("jsonwebtoken");
const frontController = require("../controllers/front-controller.js");
const isLoggedIn = require("../middleware/is-logged-in");

const router = Router();

///// SIGNUP ROUTES /////
// router.get("/presignup", frontController.getPreSignup);

// router.post("/presignup", frontController.postPreSignup);

router.get("/signup", frontController.getSignup);

router.post("/signup", frontController.postSignup);

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

///// $ILVAS MINT ROUTES /////

router.get("/ft/mint", isLoggedIn, frontController.getMintFT);

router.post("/ft", isLoggedIn, frontController.postMintFT);

///// NFT MINT ROUTES /////

router.get("/nft/mint", isLoggedIn, frontController.getMintNFT);

router.post("/nft", isLoggedIn, frontController.postMintNFT);

///// TRANSFER ROUTES /////

router.get("/transfer", isLoggedIn, frontController.getTransfer);

router.post("/transfer", isLoggedIn, frontController.postTransfer);

module.exports = router;
