const { Router } = require("express");
const { body, param } = require("express-validator");
const { validateAll } = require("../util/validation");
const metadataController = require("../controllers/metadata-crontroller.js");

const router = Router();
// TODO: avaliar permissao, checkAuth, isLoggedIn, o que faz sentido para cada caso?

router.get(
  "/getMetadata/:tokenId",
  [param("tokenId").isString(), validateAll],
  metadataController.getMetadata
);

router.post(
  "/postMetadata",
  [body("metadata").isObject(), validateAll],
  metadataController.postMetadata
);

module.exports = router;
