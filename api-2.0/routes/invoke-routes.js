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
  "/channels/:channel/chaincodes/:chaincode/ftfromnft",
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), body("tokenId").not().isEmpty(), body("tokenAmount").isInt(), body("tokenReceiver").isEmail(), validateAll],
  invokeController.ftfromnft
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

////////// OFFLINE TRANSACTION SIGNING ROUTES //////////

router.post(
  "/channels/:channel/chaincodes/:chaincode/generate-proposal",
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), body("transaction").not().isEmpty(), body("username").not().isEmpty(), validateAll],
  invokeController.generateTransactionProposal
);

router.post(
  "/channels/:channel/chaincodes/:chaincode/send-proposal",
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), body("signature").not().isEmpty(), body("proposal").not().isEmpty(), validateAll],
  invokeController.sendSignedTransactionProposal
);

router.post(
  "/channels/:channel/chaincodes/:chaincode/commit-transaction",
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), body("signature").not().isEmpty(), body("transaction").not().isEmpty(), validateAll],
  invokeController.commitSignedTransaction
);

module.exports = router;
