const helper = require("../app/helper");
const logger = require("../util/logger");
const auth = require("../util/auth");
const models = require("../util/sequelize");
const HttpError = require("../util/http-error");
const { IdentityService } = require("fabric-ca-client");

exports.signup = async (req, res, next) => {
  let user = req.body;
  user.username = user.email;
  user.org = req.body.org; //?
  const useCSR = req.body.csr;

  logger.debug("End point : /users");
  logger.debug("Username: " + user.username);
  logger.debug("Org: " + user.org);

  //attemp to register user
  let response = await helper.registerAndGetSecret(user, useCSR, next);

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
exports.login = async (req, res, next) => {
  logger.info("Entered login route");
  // const { email, password } = req.body;
  let email = req.body.username;
  let password = req.body.password;
  //var org = req.body.org;
  let org = "Carbon"; // hardcoded

  logger.debug("Email: " + email);
  logger.debug("Password: " + password);
  logger.debug("Org: " + org);

  //look for user with given email (status is verified later)
  let user;
  try {
    user = await models.users.findOne({
      where: { email },
    });
  } catch (err) {
    return next(new HttpError(500));
  }

  //user doesnt exist => error
  if (!user) {
    return next(new HttpError(401));
  }

  //if pwd doesnt match => log this activity and don't authenticate
  if (user.password !== password) {
    //log activity
    try {
      await models.authenticationLog.create({
        userId: user.id,
        success: false,
        eventType: "login",
      });
    } catch (err) {
      return next(new HttpError(500));
    }

    //login failed due to wrong pwd
    return next(new HttpError(401));
  }

  let token;
  try {
    //create jwt
    token = auth.createJWT(email, org);

    //log succesful login
    await models.authenticationLog.create({
      userId: user.id,
      success: true,
      eventType: "login",
    });

    //send OK response
    return res.status(200).json({
      message: `Welcome!`,
      token,
    });
  } catch (err) {
    return next(new HttpError(500));
  }

  // res.redirect("/");

  // // Login
  // try {
  //   let registeredPassword = await helper.queryAttribute(username, org, "password");

  //   if (registeredPassword != null)
  //     if (registeredPassword == password) {
  //       // Password verification
  //       let token;
  //       token = auth.createJWT(username, org);
  //       res.json({ success: true, message: "The user was logged in successfully", token: token });
  //       logger.info("User %s was logged in successfully", username);
  //     } else {
  //       res.json({ success: false, message: "Username and/or password wrong" });
  //     }
  // } catch (e) {
  //   res.json({ success: false, message: e.message });
  //   logger.error(e.message);
  // }
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
