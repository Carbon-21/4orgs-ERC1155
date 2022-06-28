// const express = require("express");
// const expressJWT = require("express-jwt");
// const jwt = require("jsonwebtoken");
// const bearerToken = require("express-bearer-token");
// const cors = require("cors");

// const constants = require("../config/constants.json");
const helper = require("../app/helper");
// const invoke = require("../app/invoke");
// const qscc = require("../app/qscc");
// const query = require("../app/query");
const logger = require("../util/logger");
const auth = require("../util/auth");
// const HttpError = require("../util/http-error");

// TODO mover
function getErrorMessage(field) {
  var response = {
    success: false,
    message: field + " field is missing or Invalid in the request",
  };
  return response;
}

exports.signup = async (req, res, next) => {
  var username = req.body.username;
  var orgName = req.body.orgName;
  logger.debug("End point : /users");
  logger.debug("User name : " + username);
  logger.debug("Org name  : " + orgName);

  if (!username) {
    res.json(getErrorMessage("'username'"));
    return;
  }
  if (!orgName) {
    res.json(getErrorMessage("'orgName'"));
    return;
  }

  //create jwt
  let token;
  token = auth.createJWT(username, orgName);

  // return res.status(200).json({
  //   message: `Welcome!`,
  //   token,
  // });

  let response = await helper.registerAndGerSecret(username, orgName);

  logger.debug(
    "-- returned from registering the username %s for organization %s",
    username,
    orgName
  );
  if (response && typeof response !== "string") {
    logger.debug(
      "Successfully registered the username %s for organization %s",
      username,
      orgName
    );
    response.token = token;
    res.json(response);
  } else {
    logger.debug(
      "Failed to register the username %s for organization %s with::%s",
      username,
      orgName,
      response
    );
    res.json({ success: false, message: response });
  }
};

// app.post("/users", async function (req, res) {
//   var username = req.body.username;
//   var orgName = req.body.orgName;
//   logger.debug("End point : /users");
//   logger.debug("User name : " + username);
//   logger.debug("Org name  : " + orgName);
//   if (!username) {
//     res.json(getErrorMessage("'username'"));
//     return;
//   }
//   if (!orgName) {
//     res.json(getErrorMessage("'orgName'"));
//     return;
//   }

//   var token = jwt.sign(
//     {
//       exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
//       username: username,
//       orgName: orgName,
//     },
//     app.get("secret")
//   );

//   let response = await helper.getRegisteredUser(username, orgName, true);

//   logger.debug(
//     "-- returned from registering the username %s for organization %s",
//     username,
//     orgName
//   );
//   if (response && typeof response !== "string") {
//     logger.debug(
//       "Successfully registered the username %s for organization %s",
//       username,
//       orgName
//     );
//     response.token = token;
//     res.json(response);
//   } else {
//     logger.debug(
//       "Failed to register the username %s for organization %s with::%s",
//       username,
//       orgName,
//       response
//     );
//     res.json({ success: false, message: response });
//   }
// });
