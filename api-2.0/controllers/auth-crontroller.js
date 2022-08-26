const helper = require("../app/helper");
const logger = require("../util/logger");
const auth = require("../util/auth");
const models = require("../util/sequelize");
const HttpError = require("../util/http-error");
const crypto = require("crypto");
const { IdentityService } = require("fabric-ca-client");

//given the username, return a salt so the user can perform the PHS
exports.getSalt = async (req, res, next) => {
  const email = req.body.email;
  const isSignUp = req.body.isSignUp;

  const weed = "1e578388e2d1778e313e855e95aec08bcd1d77166df5ac0a67c49b41593987af"; // .env
  let seed = generateSeed(); //must be generated here, so all cases have the same response time

  //look for user with given email
  let user;
  try {
    user = await models.users.findOne({
      where: { email },
    });
  } catch (err) {
    return next(new HttpError(500));
  }

  //signup and user already exists => error
  if (isSignUp && user) {
    return next(new HttpError(409));
  }

  //login and user doesnt exist => generate HKDF salt from weed
  if (!isSignUp && !user) {
    const salt = generateSalt(email, weed);
  } else {
    const salt = generateSalt(email, seed);
  }

  //add PHS info to DB
  try {
    user = await models.users.phs({ email, salt, seed });
  } catch (err) {
    logger.error(err);
    return next(new HttpError(500));
  }
};

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

  //look for user with given email
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

//derive key from seed, which will be sent to the user so they can use it as salt to perform PHS
const generateSalt = (username, seed) => {
  const domain = "cabon21.com";

  const derivedKey = crypto.hkdfSync("sha256", seed, username, domain, 32);

  return Buffer.from(derivedKey).toString("hex");
};

//generate 256 bit seed
const generateSeed = () => {
  const seed = crypto.randomBytes(32).toString("hex");
  console.log(seed);
  return seed;
};
