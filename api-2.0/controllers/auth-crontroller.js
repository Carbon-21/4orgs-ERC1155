const helper = require("../app/helper");
const logger = require("../util/logger");
const auth = require("../util/auth");

// TODO mover
// function getErrorMessage(field) {
//   var response = {
//     success: false,
//     message: field + " field is missing or Invalid in the request",
//   };
//   return response;
// }

exports.signup = async (req, res, next) => {
  var username = req.body.username;
  var org = req.body.org;

  logger.debug("End point : /users");
  logger.debug("User name : " + username);
  logger.debug("Org name  : " + org);

  // if (!username) {
  //   res.json(getErrorMessage("'username'"));
  //   return;
  // }
  // if (!org) {
  //   res.json(getErrorMessage("'org'"));
  //   return;
  // }

  //create jwt
  let token;
  token = auth.createJWT(username, org);

  let response = await helper.registerAndGerSecret(username, org);

  logger.debug("-- returned from registering the username %s for organization %s", username, org);
  if (response && typeof response !== "string") {
    logger.debug("Successfully registered the username %s for organization %s", username, org);
    response.token = token;
    res.json(response);
  } else {
    logger.debug(
      "Failed to register the username %s for organization %s with::%s",
      username,
      org,
      response
    );
    res.json({ success: false, message: response });
  }
};

// app.post("/users", async function (req, res) {
//   var username = req.body.username;
//   var org = req.body.org;
//   logger.debug("End point : /users");
//   logger.debug("User name : " + username);
//   logger.debug("Org name  : " + org);
//   if (!username) {
//     res.json(getErrorMessage("'username'"));
//     return;
//   }
//   if (!org) {
//     res.json(getErrorMessage("'org'"));
//     return;
//   }

//   var token = jwt.sign(
//     {
//       exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
//       username: username,
//       org: org,
//     },
//     app.get("secret")
//   );

//   let response = await helper.getRegisteredUser(username, org, true);

//   logger.debug(
//     "-- returned from registering the username %s for organization %s",
//     username,
//     org
//   );
//   if (response && typeof response !== "string") {
//     logger.debug(
//       "Successfully registered the username %s for organization %s",
//       username,
//       org
//     );
//     response.token = token;
//     res.json(response);
//   } else {
//     logger.debug(
//       "Failed to register the username %s for organization %s with::%s",
//       username,
//       org,
//       response
//     );
//     res.json({ success: false, message: response });
//   }
// });
