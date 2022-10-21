const { Router } = require("express");
const { body, query, param } = require("express-validator");

const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const queryController = require("../controllers/query-controller.js");

const router = Router();

//// UNAUTHENTICATED ROUTES ////

///// AUTHENTICATED ROUTES /////
router.use(checkAuth);

router.get(
  "/channels/:channel/chaincodes/:chaincode/balance",
  [
    param("channel").trim().not().isEmpty().isString(),
    param("chaincode").trim().not().isEmpty().isString(),
    query("tokenId").trim().not().isEmpty().isString(),
    query("tokenOwner").trim().not().isEmpty().isEmail(),
    validateAll,
  ],
  queryController.balance
);

router.get(
  "/channels/:channel/chaincodes/:chaincode/selfBalance",
  [param("channel").trim().not().isEmpty().isString(), param("chaincode").trim().not().isEmpty().isString(), query("tokenId").trim().not().isEmpty().isString(), validateAll],
  queryController.selfBalance
);

router.get(
  "/channels/:channel/chaincodes/:chaincode/balanceNFT",
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), query("tokenOwner").isEmail(), validateAll],
  queryController.balanceNFT
);

router.get(
  "/channels/:channel/chaincodes/:chaincode/selfBalanceNFT",
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), validateAll],
  queryController.selfBalanceNFT
);

router.get(
  "/channels/:channel/chaincodes/:chaincode/totalSupply",
  [param("channel").trim().not().isEmpty().isString(), param("chaincode").trim().not().isEmpty().isString(), query("tokenId").trim().not().isEmpty().isString(), validateAll],
  queryController.totalSupply
);

router.get(
  "/channels/:channel/chaincodes/:chaincode/getURI",
  [param("channel").trim().not().isEmpty().isString(), param("chaincode").trim().not().isEmpty().isString(), query("tokenId").trim().not().isEmpty().isString(), validateAll],
  queryController.getURI
);

module.exports = router;
