//check if req has a jwt token, throwing an error if it doesnt have it, thus blocking access to routes followed by this middleware

const { verify } = require("jsonwebtoken");
const HttpError = require("../util/http-error");

module.exports = (req, res, next) => {
  //OPTIONS is sent by the browser before tha actual request
  

  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    // Authorization: 'Bearer TOKEN'
    console.log("headers", req.headers);
    console.log("headers", req.headers.authorization.split(" ")[1]);
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      throw new Error("Authentication failed!");
    }

    //decode token and get user info
    const decodedToken = verify(token, process.env.JWT_SECRET_KEY);

    //pass user info to next middleware
    req.jwt = {
      username: decodedToken.username,
      org: decodedToken.org,
    };
    console.log("chegou aqui iudsgihsd");

    next();
  } catch (err) {
    console.log("foi aquii o erro");
    console.log(err);
    return next(new HttpError(401)); //no auth jwt
  }
};
