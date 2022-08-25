const helper = require("../app/helper");
const logger = require("../util/logger");
const auth = require("../util/auth");
const { IdentityService } = require("fabric-ca-client");

exports.signup = async (req, res, next) => {
  let user = req.body;
  user.org = req.body.org;
  var useCSR = req.body.useCSR;
  let csr = req.body.csr;

  logger.debug("End point : /users");
  logger.debug("Username: " + user.username);
  logger.debug("Org: " + user.org);

  //attemp to register user
  let response = await helper.registerAndGerSecret(user, useCSR, csr);

  //response
  logger.debug(
    "-- returned from registering the username %s for organization %s",
    user.username,
    user.org
  );
  if (response && typeof response !== "string") {
    logger.info(
      "Successfully registered the username %s for organization %s",
      user.username,
      user.org
    );
    res.json(response);
  } else {
    logger.error(
      "Failed to register the username %s for organization %s with::%s",
      user.username,
      user.org,
      user.response
    );
    res.json({ success: false, message: response });
  }
};

/*acrescentada a rota de login, com um processo básico de verificação de senha (sem PHS implementado ainda). Além disso, na rota do signup,
 *a parte de retornar o token JWT foi deslocada para para a parte de login.
 */
exports.login = async (req, res) => {
  logger.info("Entered login route");
  let username = req.body.username;
  //var org = req.body.org;
  let org = "Carbon"; // hardcoded
  let password = req.body.password;

  logger.debug("Username: " + username);
  logger.debug("Org: " + org);

  // Login
  try {
    let registeredPassword = await helper.queryAttribute(username, org, "password");

    if (registeredPassword != null)
      if (registeredPassword == password) {
        // Password verification
        let token;
        token = auth.createJWT(username, org);
        res.json({ success: true, message: "The user was logged in successfully", token: token });
        logger.info("User %s was logged in successfully", username);
      } else {
        res.json({ success: false, message: "Username and/or password wrong" });
      }
  } catch (e) {
    res.json({ success: false, message: e.message });
    logger.error(e.message);
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

//   let isUserRegistered = await helper.isUserRegistered(username, org);

//   if (isUserRegistered) {
//     res.json({ success: true, message: { token: token } });
//   } else {
//     res.json({
//       success: false,
//       message: `User with username ${username} is not registered with ${org}, Please register first.`,
//     });
//   }
// });
