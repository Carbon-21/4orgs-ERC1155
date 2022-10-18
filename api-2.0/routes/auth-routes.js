const { Router } = require("express");
const { body } = require("express-validator");
const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const authController = require("../controllers/auth-crontroller.js");

const router = Router();

//// UNAUTHENTICATED ROUTES ////
router.post("/getSalt", [body("email").isEmail(), body("isSignUp").isBoolean(), validateAll], authController.getSalt);

router.post("/signup", [body("email").isEmail(), body("name").isString(), body("password").isString(), body("cpf").isString(), validateAll], authController.signup);

router.post("/login", [body("email").isEmail(), body("password").isString(), validateAll], authController.login);

///// AUTHENTICATED ROUTES /////
router.use(checkAuth);

module.exports = router;
