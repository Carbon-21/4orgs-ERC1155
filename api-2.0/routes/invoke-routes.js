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
  [
    param("channel").not().isEmpty(),
    param("chaincode").not().isEmpty(),
    body("tokenId").not().isEmpty(),
    body("tokenAmount").not().isEmpty().isInt(),
    body("tokenReceiver").not().isEmpty(),
    validateAll,
  ],
  invokeController.mint
);

router.post(
  "/channels/:channel/chaincodes/:chaincode/transfer",
  [
    param("channel").not().isEmpty(),
    param("chaincode").not().isEmpty(),
    body("tokenId").not().isEmpty(),
    body("tokenAmount").not().isEmpty().isInt(),
    body("tokenSender").not().isEmpty(),
    body("tokenReceiver").not().isEmpty(),
    validateAll,
  ],
  invokeController.transfer
);

module.exports = router;
