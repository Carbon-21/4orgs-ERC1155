const helper = require("../app/helper");
const logger = require("../util/logger");
const auth = require("../util/auth");

exports.signup = async (req, res, next) => {
  var username = req.body.username;
  // var org = req.body.org;
  var org = "Carbon";
  // var useCSR = req.body.csr;
  var useCSR = false;

  logger.debug("End point : /users");
  logger.debug("Username: " + username);
  logger.debug("Org: " + org);

  //create jwt
  let token;
  token = auth.createJWT(username, org);

  //attemp to register user
    let response = await helper.registerAndGerSecret(username, org, useCSR);

    //response
    logger.debug("-- returned from registering the username %s for organization %s", username, org);
    if (response && typeof response !== "string") {
      logger.info("Successfully registered the username %s for organization %s", username, org);
      response.token = token;
      res.json(response);
    } else {
      logger.error(
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
