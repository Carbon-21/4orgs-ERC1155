const { Router } = require("express");
const { body } = require("express-validator");

const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const authController = require("../controllers/auth-crontroller.js");

const router = Router();

//// UNAUTHENTICATED ROUTES ////
router.post(
  "/signup",
  [body("username").not().isEmpty(), body("org").not().isEmpty(), body("csr").not().isEmpty(), validateAll],
  authController.signup
);

//TODO login middleware

///// AUTHENTICATED ROUTES /////
router.use(checkAuth);

module.exports = router;
