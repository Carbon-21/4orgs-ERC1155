const { Router } = require("express");
const { body, param } = require("express-validator");

const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const invokeController = require("../controllers/invoke-controller.js");

const router = Router();

//// UNAUTHENTICATED ROUTES ////

///// AUTHENTICATED ROUTES /////
router.use(checkAuth);

router.post(
  "/channels/:channel/chaincodes/:chaincode/mint",
  [param("channel").isString(), param("chaincode").isString(), body("tokenId").isString(), body("tokenAmount").isInt(), body("tokenReceiver").isEmail(), validateAll],
  invokeController.mint
);

router.post(
  "/channels/:channel/chaincodes/:chaincode/transfer",
  [
    param("channel").isString(),
    param("chaincode").isString(),
    body("tokenId").isString(),
    body("tokenAmount").isInt(),
    body("tokenSender").isEmail(),
    body("tokenReceiver").isEmail(),
    validateAll,
  ],
  invokeController.transfer
);

router.post(
  "/channels/:channel/chaincodes/:chaincode/setURI",
  [param("channel").isString(), param("chaincode").isString(), body("tokenId").isString(), body("URI").isURL(), validateAll],
  invokeController.setURI
);

module.exports = router;
