const { Router } = require("express");
const { body } = require("express-validator");

const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const authController = require("../controllers/auth-crontroller.js");

const router = Router();

//// UNAUTHENTICATED ROUTES ////

//// Signup ////

router.get("/signup", (req, res) => {
  res.render("signup", { title: "Signup", cssPath: "../css/signup.css" });
});

router.post(
  "/signup",
  // [body("username").not().isEmpty(), body("org").not().isEmpty(), body("csr").not().isEmpty(), validateAll],
  authController.signup
);

router.post(
  "/login",
  [body("username").not().isEmpty(), body("org").not().isEmpty(), validateAll],
  authController.login
);

///// AUTHENTICATED ROUTES /////

//// Login ////

router.get("/login", (req, res) => {
  res.render("login", { title: "Login", cssPath: "../css/login.css" });
});

router.use(checkAuth);


module.exports = router;
