//check if req has a jwt token, throwing an error if it doesnt have it, thus blocking access to routes followed by this middleware

const jwt = require("jsonwebtoken");
const HttpError = require("../util/http-error");

module.exports = (req, res, next) => {
  //OPTIONS is sent by the browser before tha actual request
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    // Authorization: 'Bearer TOKEN'
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      throw new Error("Authentication failed!");
    }

    //decode token and get user info
    //TODO .env
    const decodedToken = jwt.verify(token, "supersecreeeet_dont_share");

    //pass user info to next middleware
    req.jwt = {
      username: decodedToken.username,
      org: decodedToken.org,
    };

    next();
  } catch (err) {
    return next(new HttpError(401)); //no auth jwt
  }
};
