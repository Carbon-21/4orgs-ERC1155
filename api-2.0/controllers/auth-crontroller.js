const helper = require("../app/helper");
const logger = require("../util/logger");
const auth = require("../util/auth");
const models = require("../util/sequelize");
const HttpError = require("../util/http-error");
const crypto = require("crypto");
const { IdentityService } = require("fabric-ca-client");

//.env
const weed = "0118a6dd0c8c93fbc4c49e4ad3a7ce57fe3d29e07ed7b249a55da6dd578d18e1";
const domain = "carbon21.com";

//given the username, return a salt so the user can perform the PHS
exports.getSalt = async (req, res, next) => {
  const email = req.body.email;
  const isSignUp = req.body.isSignUp;

  //look for user with given email
  let user;
  try {
    user = await models.users.findOne({
      where: { email },
    });
  } catch (err) {
    return next(new HttpError(500));
  }

  if (isSignUp) {
    if (user) {
      //user already registering/signing up => return salt
      if (user.status === "registering") {
        return res.status(200).json({
          success: true,
          salt: user.salt,
        });
      }
      //user already exists and its not still registering/signing up => error
      else {
        return next(new HttpError(409));
      }
    }
    //
    else {
      const seed = generateSeed();
      const salt = generateSalt(email, seed);
      const weededSalt = generateSalt(email, weed);

      //add PHS info to DB
      try {
        await models.users.create({ email, seed, salt, weededSalt });
      } catch (err) {
        logger.error(err);
        return next(new HttpError(500));
      }

      return res.status(200).json({
        success: true,
        salt,
      });
    }
  }

  // login: return weeded (dummy) salt if user doesn't exist
  else {
    // TODO validar que é assim mesmo. faz sentiudo, para deixar o tempo de resposta igual nos dois cenários abaixo, no entanto é um procedimento desnecessário quando o usuário de fato existir.
    const weededSalt = generateSalt(email, weed);

    if (user && user.status === "active") {
      return res.status(200).json({
        success: true,
        salt: user.salt,
      });
    } else {
      return res.status(200).json({
        success: true,
        salt: weededSalt,
      });
    }
  }
};

exports.signup = async (req, res, next) => {
  logger.trace("Entered signup controller");

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
  logger.trace("Entered login controller");

  const org = "Carbon"; // hardcoded
  const email = req.body.username;
  let password = req.body.password;

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
  //registering means that the signup process wasn't complete
  if (!user || user.status === "registering") {
    return next(new HttpError(401));
  }

  //user registering  => error
  if (user.status === "pending") {
    return next(new HttpError(403, "Por favor, confirme seu cadastro via email."));
  }

  //on a shell, user must be active
  if (user.status !== "active") {
    return next(new HttpError(412, "Usuário inativo. Contate o suporte para mais informações."));
  }

  //password is stored in DB as a derivation from the PHS sent from the user, using their seed as salt.
  //derive it again so we can check if the given pwd is correct
  password = Buffer.from(crypto.hkdfSync("sha256", password, user.seed, domain, 32)).toString(
    "hex"
  );

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
    logger.error(err);
    return next(new HttpError(500));
  }
};

//derive key from seed, which will be sent to the user so they can use it as salt to perform PHS
const generateSalt = (username, seed) => {
  const derivedKey = crypto.hkdfSync("sha256", seed, username, domain, 32);

  return Buffer.from(derivedKey).toString("hex");
};

//generate 256 bit seed
const generateSeed = () => {
  const seed = crypto.randomBytes(32).toString("hex");
  console.log(seed);
  return seed;
};
