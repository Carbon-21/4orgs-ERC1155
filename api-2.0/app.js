"use strict";

///// REQUIRES /////
//npm packages
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const axios = require("axios").default;

//native packages
const bodyParser = require("body-parser");
const path = require("path");

//local packages
const constants = require("./config/constants.json");
const logger = require("./util/logger");
const cors = require("./middleware/cors");
const error = require("./middleware/error");

//routes
const authRoutes = require("./routes/auth-routes");
// const chaincodeRoutes = require("./routes/chaincode-routes");
const invokeRoutes = require("./routes/invoke-routes");
const queryRoutes = require("./routes/query-routes");
const frontRoutes = require("./routes/front-routes");

///// CONFIGS /////
//express
const app = express();

//cors
app.use(cors);

//bodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//network
const host = process.env.HOST || constants.host;
const port = process.env.PORT || constants.port;

//front
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const sessionConfig = {
  secret: "thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());

app.use((req, res, next) => {
  // res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.session.token;
  res.locals.currentUsername = req.session.username;
  // res.locals.currentUserOrg = req.session.org;
  next();
});

app.get("/", function (req, res) {
  res.render("home", { title: "Home", cssPath: "css/home.css" });
});

///// ROUTES /////
app.use("/auth", authRoutes);
// app.use("/chaincode", chaincodeRoutes);
app.use("/invoke", invokeRoutes);
app.use("/query", queryRoutes);
app.use("/", frontRoutes);

///// SERVER INIT /////
app.listen(port);
logger.info("****************** SERVER STARTED ************************");
logger.info("***************  http://%s:%s  ******************", host, port);

///// ERROR MIDDLEWARE /////
//executed if any other middleware yields an error
app.use(error);
