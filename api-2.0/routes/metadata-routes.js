const { Router } = require("express");
const { body, query } = require("express-validator");
const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const metadataController = require("../controllers/metadata-crontroller.js");

const router = Router();
router.use(checkAuth);

router.get("/getMetadata", [query("tokenId").not().isEmpty().isString(), validateAll], metadataController.getMetadata);

router.post(
  "/postMetadata",
  [
    body("tokenId").not().isEmpty().isString(),
    body("metadata").not().isEmpty().isObject(),
    body("metadata.id").not().isEmpty(),
    body("metadata.status").not().isEmpty(),
    body("metadata.amount").not().isEmpty().isNumeric(),
    body("metadata.land_owner").not().isEmpty(),
    body("metadata.land").not().isEmpty().isNumeric(),
    body("metadata.phyto").not().isEmpty(),
    body("metadata.geolocation").not().isEmpty(),
    body("metadata.compensation_owner").not().isEmpty(),
    body("metadata.compensation_state").not().isEmpty(),
    validateAll,
  ],
  metadataController.postMetadata
);

router.patch(
  "/patchMetadata",
  [
    body("tokenId").not().isEmpty().isString(),
    body("metadata").not().isEmpty().isObject(),
    body("metadata.id").not().isEmpty(),
    body("metadata.status").not().isEmpty(),
    body("metadata.amount").not().isEmpty().isNumeric(),
    body("metadata.land_owner").not().isEmpty(),
    body("metadata.land").not().isEmpty().isNumeric(),
    body("metadata.phyto").not().isEmpty(),
    body("metadata.geolocation").not().isEmpty(),
    body("metadata.compensation_owner").not().isEmpty(),
    body("metadata.compensation_state").not().isEmpty(),
    validateAll,
  ],
  metadataController.postMetadata
);

module.exports = router;
