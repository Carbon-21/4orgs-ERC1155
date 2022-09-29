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
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), query("tokenId").not().isEmpty(), query("tokenOwner").not().isEmpty(), validateAll],
  queryController.balance
);

router.get(
  "/channels/:channel/chaincodes/:chaincode/selfBalance",
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), query("tokenId").not().isEmpty(), validateAll],
  queryController.selfBalance
);

router.get(
  "/channels/:channel/chaincodes/:chaincode/totalSupply",
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), query("tokenId").not().isEmpty(), validateAll],
  queryController.totalSupply
);

router.get(
  "/channels/:channel/chaincodes/:chaincode/getURI",
  [param("channel").not().isEmpty(), param("chaincode").not().isEmpty(), query("tokenId").not().isEmpty(), validateAll],
  queryController.getURI
);

module.exports = router;
