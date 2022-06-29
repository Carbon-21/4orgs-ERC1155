const { Router } = require("express");
// const { body } = require("express-validator");

// const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const chaincodeController = require("../controllers/chaincode-controller.js");
// const fileUpload = require("../middleware/file-upload");

const router = Router();

////UNAUTHENTICATED ROUTES////

/////AUTHENTICATED ROUTES/////
router.use(checkAuth);

router.get(
  "/channels/:channelName/chaincodes/:chaincodeName",
  chaincodeController.query
);
router.post(
  "/channels/:channelName/chaincodes/:chaincodeName",
  chaincodeController.invoke
);

module.exports = router;
