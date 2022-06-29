const { Router } = require("express");
// const { body } = require("express-validator");

// const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const authController = require("../controllers/auth-crontroller.js");
// const fileUpload = require("../middleware/file-upload");

const router = Router();

////UNAUTHENTICATED ROUTES////
router.post("/signup", authController.signup);
//TODO login middleware

/////AUTHENTICATED ROUTES/////
router.use(checkAuth);

module.exports = router;
