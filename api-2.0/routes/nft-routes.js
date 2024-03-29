const { Router } = require("express");
const { body, query, param } = require("express-validator");
const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const nftController = require("../controllers/nft-controller.js");

const router = Router();
router.use(checkAuth);

router.get("/getMetadata", [query("tokenId").not().isEmpty().isString(), validateAll], nftController.getMetadata);

router.post(
  "/postMetadata",
  [
    body("tokenId").not().isEmpty().isString(),
    body("metadata").not().isEmpty().isObject(),
    body("metadata.id").not().isEmpty().isString(),
    body("metadata.status").not().isEmpty().isString(),
    body("metadata.amount").not().isEmpty().isNumeric(),
    body("metadata.land_owner").not().isEmpty().isString(),
    body("metadata.land").not().isEmpty().isNumeric(),
    body("metadata.phyto").not().isEmpty().isString(),
    body("metadata.geolocation").not().isEmpty().isString(),
    body("metadata.compensation_owner").not().isEmpty().isString(),
    body("metadata.compensation_state").not().isEmpty().isString(),
    validateAll,
  ],
  nftController.postMetadata
);

router.patch(
  "/patchMetadata",
  [
    body("tokenId").not().isEmpty().isString(),
    body("metadata").not().isEmpty().isObject(),
    body("metadata.id").not().isEmpty().isString(),
    body("metadata.status").not().isEmpty().isString(),
    body("metadata.amount").not().isEmpty().isNumeric(),
    body("metadata.land_owner").not().isEmpty().isString(),
    body("metadata.land").not().isEmpty().isNumeric(),
    body("metadata.phyto").not().isEmpty().isString(),
    body("metadata.geolocation").not().isEmpty().isString(),
    body("metadata.compensation_owner").not().isEmpty().isString(),
    body("metadata.compensation_state").not().isEmpty().isString(),
    validateAll,
  ],
  nftController.postMetadata
);

///// NFT REQUESTS CONTROLLERS /////

router.get("/requests", [query("requestStatus").not().isEmpty().isString(), validateAll], nftController.getNftRequests);

router.put(
  "/requests/:id",
  [
    body("aprove").not().isEmpty().isString(),
    param("id").not().isEmpty().isString(),
    validateAll
  ],
  nftController.updateNftRequestStatus
);

module.exports = router;
