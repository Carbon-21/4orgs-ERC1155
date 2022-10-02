const { Router } = require("express");
const { body, query, param } = require("express-validator");

const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const chaincodeController = require("../controllers/chaincode-controller.js");

const router = Router();

//// UNAUTHENTICATED ROUTES ////

///// AUTHENTICATED ROUTES /////
router.use(checkAuth);

router.get(
  "/channels/:channelName/chaincodes/:chaincodeName",
  [
    param("channelName").not().isEmpty(),
    param("chaincodeName").not().isEmpty(),
    query("fcn").not().isEmpty(),
    // mam: Algumas funções não requerem parâmetros (e.g. ClientAccountID)
    // query("args").not().isEmpty(),
    validateAll,
  ],
  chaincodeController.query
);

router.post(
  "/channels/:channelName/chaincodes/:chaincodeName",
  [
    param("channelName").not().isEmpty(),
    param("chaincodeName").not().isEmpty(),
    body("fcn").not().isEmpty(),
    // body("args").not().isEmpty(),
    validateAll,
  ],
  chaincodeController.invoke
);

router.post(
  "/generate-proposal",
  chaincodeController.generateTransactionProposal
);

router.post(
  "/send-proposal",
  chaincodeController.sendSignedProposal
);

router.post(
  "/commit-transaction",
  chaincodeController.commitSignedTransaction
);

module.exports = router;
