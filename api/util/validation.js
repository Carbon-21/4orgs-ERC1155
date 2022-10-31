const HttpError = require("./http-error");
const { validationResult } = require("express-validator");
const fs = require("fs");

//throw error if data is not valid (express-validator)
const validateAll = (req, res, next) => {
  const errors = validationResult(req);

  //if there are errors
  if (!errors.isEmpty()) {
    throw new HttpError(422);
  }

  return next();
};

exports.validateAll = validateAll;
