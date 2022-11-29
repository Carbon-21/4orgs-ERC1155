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
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    body("tokenId").trim().not().isEmpty().isString(),
    body("tokenAmount").trim().not().isEmpty().isInt({ min: 1 }),
    body("tokenReceiver").trim().not().isEmpty().isEmail(),
    validateAll,
  ],
  invokeController.mint
);

router.post("/channels/:channel/chaincodes/:chaincode/ftfromnft", [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), validateAll], invokeController.ftfromnft);

router.post(
  "/channels/:channel/chaincodes/:chaincode/transfer",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    body("tokenId").trim().not().isEmpty().isString(),
    body("tokenAmount").trim().not().isEmpty().isInt({ min: 1 }),
    body("tokenSender").trim().not().isEmpty().isEmail(),
    body("tokenReceiver").trim().not().isEmpty().isEmail(),
    validateAll,
  ],
  invokeController.transfer
);

////////// AUXILIARY ROUTES //////////
//used by postMetadata
router.post(
  "/channels/:channel/chaincodes/:chaincode/setURI",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    body("tokenId").trim().not().isEmpty().isString(),
    body("URI").trim().not().isEmpty().isURL(),
    validateAll,
  ],
  invokeController.setURI
);

//the three routes below are used  offline transactions
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
