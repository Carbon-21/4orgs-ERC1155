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

module.exports = router;
