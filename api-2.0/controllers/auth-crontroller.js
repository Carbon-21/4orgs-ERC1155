const helper = require("../app/helper");
const logger = require("../util/logger");
const auth = require("../util/auth");
const models = require("../util/sequelize");
const HttpError = require("../util/http-error");
const { IdentityService } = require("fabric-ca-client");

exports.signup = async (req, res, next) => {
  let user = req.body;
  user.username = user.email;
  const useCSR = req.body.csr;
  user.org = "Carbon";

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

  //if pwd doesnt match or org isnt carbon => log this activity and don't authenticate
  if (user.password !== password || user.org !== org) {
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
      success: true,
      token,
    });
  } catch (err) {
    console.log(err);
    return next(new HttpError(500));
  }
};
