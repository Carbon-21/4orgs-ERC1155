"use strict";

/////REQUIRES/////
//npm packages
const express = require("express");

//native packages
const bodyParser = require("body-parser");

//local packages
const constants = require("./config/constants.json");
const logger = require("./util/logger");
const cors = require("./middleware/cors");

//routes
const authRoutes = require("./routes/auth-routes");
const chaincodeRoutes = require("./routes/chaincode-routes");

/////CONFIGS/////
//express
const app = express();

//cors
app.use(cors);

//bodyParser
app.use(bodyParser.json());

//network
const host = process.env.HOST || constants.host;
const port = process.env.PORT || constants.port;

/////SERVER INIT/////
app.listen(port, function () {
  console.log(`Server started on ${port}`);
});

logger.info("****************** SERVER STARTED ************************");
logger.info("***************  http://%s:%s  ******************", host, port);

/////ROUTES/////
app.use("/auth", authRoutes);
app.use("/chaincode", chaincodeRoutes);

// Login and get jwt
// TODO acertar esse middleware e o de signup pra fazerem sentido de fato kkk
// app.post("/users/login", async function (req, res) {
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
