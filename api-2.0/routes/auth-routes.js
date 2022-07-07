const { Router } = require("express");
const { body } = require("express-validator");

const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const authController = require("../controllers/auth-controller.js");

const router = Router();

//// UNAUTHENTICATED ROUTES ////
router.post(
  "/signup",
  [body("username").not().isEmpty(), body("org").not().isEmpty(), validateAll],
  authController.signup
);

router.post(
  "/login",
  [body("username").not().isEmpty(), body("org").not().isEmpty(), validateAll],
  authController.login
);

///// AUTHENTICATED ROUTES /////
router.use(checkAuth);


module.exports = router;
