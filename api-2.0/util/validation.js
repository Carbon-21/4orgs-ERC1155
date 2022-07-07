const HttpError = require("./http-error");
const { validationResult } = require("express-validator");
const logger = require("../util/logger");

//throw error if data is not valid (express-validator)
const validateAll = (req, res, next) => {
  const errors = validationResult(req);

  //if there are errors
  if (!errors.isEmpty()) {
    logger.debug("Req.jwt: " + JSON.stringify(req.jwt));
    logger.debug("Req.params: " + JSON.stringify(req.params));
    logger.debug("Req.query: " + JSON.stringify(req.query));
    logger.debug("Req.body: " + JSON.stringify(req.body));
    throw new HttpError(422);
  }

  return next();
};

exports.validateAll = validateAll;
