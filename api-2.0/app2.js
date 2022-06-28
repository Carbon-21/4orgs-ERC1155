"use strict";

/* REQUIRES */
//npm packages
const express = require("express");
const cors = require("cors");

//native packages
const bodyParser = require("body-parser");
const http = require("http");

//local packages
const constants = require("./config/constants.json");
const logger = require("./util/logger");

//routes
const authRoutes = require("./routes/auth-routes");
const chaincodeRoutes = require("./routes/chaincode-routes");

/* CONFIGS */
//network
const host = process.env.HOST || constants.host;
const port = process.env.PORT || constants.port;

//express
const app = express();

//cors
app.options("*", cors()); //TODO precisa??
app.use(cors());

//bodyParser
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    //TODO precisa?
    extended: false,
  })
);

/* JWT */
// app.set("secret", "thisismysecret");
// app.use(
//   expressJWT({
//     secret: "thisismysecret",
//   }).unless({
//     path: ["/users", "/users/login", "/register"],
//   })
// );
// app.use(bearerToken());

// app.use((req, res, next) => {
//   logger.debug("New req for %s", req.originalUrl);
//   if (
//     req.originalUrl.indexOf("/users") >= 0 ||
//     req.originalUrl.indexOf("/users/login") >= 0 ||
//     req.originalUrl.indexOf("/register") >= 0
//   ) {
//     return next();
//   }
//   var token = req.token;
//   jwt.verify(token, app.get("secret"), (err, decoded) => {
//     if (err) {
//       console.log(`Error ================:${err}`);
//       res.send({
//         success: false,
//         message:
//           "Failed to authenticate token. Make sure to include the " +
//           "token returned from /users call in the authorization header " +
//           " as a Bearer token",
//       });
//       return;
//     } else {
//       req.username = decoded.username;
//       req.orgname = decoded.orgName;
//       logger.debug(
//         util.format(
//           "Decoded from JWT token: username - %s, orgname - %s",
//           decoded.username,
//           decoded.orgName
//         )
//       );
//       return next();
//     }
//   });
// });

/* SERVER INIT */
//TODO semantica ultrapassada, da pra remover esse pacote http (só é usado aqui)
var server = http.createServer(app).listen(port, function () {
  console.log(`Server started on ${port}`);
});
logger.info("****************** SERVER STARTED ************************");
logger.info("***************  http://%s:%s  ******************", host, port);
server.timeout = 240000;

//TODO tirar
function getErrorMessage(field) {
  var response = {
    success: false,
    message: field + " field is missing or Invalid in the request",
  };
  return response;
}

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/chaincode", chaincodeRoutes);

// Login and get jwt
// TODO acertar esse middleware e o de signup pra fazerem sentido de fato kkk
// app.post("/users/login", async function (req, res) {
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

//   let isUserRegistered = await helper.isUserRegistered(username, orgName);

//   if (isUserRegistered) {
//     res.json({ success: true, message: { token: token } });
//   } else {
//     res.json({
//       success: false,
//       message: `User with username ${username} is not registered with ${orgName}, Please register first.`,
//     });
//   }
// });
