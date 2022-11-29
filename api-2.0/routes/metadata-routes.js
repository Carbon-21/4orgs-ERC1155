const { Router } = require("express");
const { body, query } = require("express-validator");
const { validateAll } = require("../util/validation");
const checkAuth = require("../middleware/check-auth");
const metadataController = require("../controllers/metadata-crontroller.js");

const router = Router();
router.use(checkAuth);

router.get("/getMetadata", [query("tokenId").not().isEmpty().isString(), validateAll], metadataController.getMetadata);

router.post("/postMetadata", [body("metadata").not().isEmpty().isObject(), validateAll], metadataController.postMetadata);

module.exports = router;
