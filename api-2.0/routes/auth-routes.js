const { Router } = require("express");
const { body } = require("express-validator");
const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const authController = require("../controllers/auth-crontroller.js");

const router = Router();

//// UNAUTHENTICATED ROUTES ////
router.post("/getSalt", [body("email").trim().not().isEmpty().isString(), body("isSignUp").not().isEmpty().isBoolean(), validateAll], authController.getSalt);

router.post(
  "/signup",
  [
    body("email").trim().not().isEmpty().isEmail(),
    body("name").trim().not().isEmpty().isString(),
    body("password").trim().not().isEmpty().isString(),
    body("cpf").trim().not().isEmpty().isString(),
    validateAll,
  ],
  authController.signup
);

router.post("/login", [body("email").trim().not().isEmpty().isString(), body("password").trim().not().isEmpty().isString(), validateAll], authController.login);
// router.post("/login", [body("email").trim().not().isEmpty().isEmail(), body("password").trim().not().isEmpty().isString(), validateAll], authController.login);

///// AUTHENTICATED ROUTES /////
router.use(checkAuth);

module.exports = router;
