const { Router } = require("express");
const metadataController = require("../controllers/metadata-crontroller.js");

const router = Router();

router.post( // post funciona bem, avaliar possibilidade de get
  "/getMetadata",
  metadataController.getMetadata
);

router.post(
  "/postMetadata",
  metadataController.postMetadata
);

module.exports = router;
