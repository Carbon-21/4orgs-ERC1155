"use strict";

///// REQUIRES /////
//npm packages
const express = require("express");

//native packages
const bodyParser = require("body-parser");
const path = require('path');

//local packages
const constants = require("./config/constants.json");
const logger = require("./util/logger");
const cors = require("./middleware/cors");
const error = require("./middleware/error");

//routes
const authRoutes = require("./routes/auth-routes");
const chaincodeRoutes = require("./routes/chaincode-routes");
const renderRoutes = require('./routes/render-routes');

///// CONFIGS /////
//express
const app = express();

//cors
app.use(cors);

//bodyParser
app.use(bodyParser.urlencoded({extended: true}));

//network
const host = process.env.HOST || constants.host;
const port = process.env.PORT || constants.port;

///// ROUTES /////
app.use("/auth", authRoutes);
app.use("/chaincode", chaincodeRoutes);
app.use("/", renderRoutes);

///// FRONT /////

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function(req, res) {
  res.render('home', {title: "Home", cssPath: "css/home.css"});
});

///// SERVER INIT /////
app.listen(port);
logger.info("****************** SERVER STARTED ************************");
logger.info("***************  http://%s:%s  ******************", host, port);

///// ERROR MIDDLEWARE /////
//executed if any other middleware yields an error
app.use(error);

// app.use((error, req, res, next) => {
//   //if an response was already sent, forward it
//   if (res.headerSent) {
//     return next(error);
//   }

//   //get error info set on previous middleware, if any
//   res.status(error.code || 500);
//   res.json({
//     message: error.message || "Ocorreu um erro. Por favor, tente novamente.",
//   });
// });

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
