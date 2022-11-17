"use strict";

///// REQUIRES /////
//npm packages
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const axios = require("axios").default;

//native packages
const bodyParser = require("body-parser");
const path = require("path");

//local packages
const logger = require("./util/logger");
const cors = require("./middleware/cors");
const error = require("./middleware/error");

//routes
const authRoutes = require("./routes/auth-routes");
// const chaincodeRoutes = require("./routes/chaincode-routes");
const invokeRoutes = require("./routes/invoke-routes");
const queryRoutes = require("./routes/query-routes");
const frontRoutes = require("./routes/front-routes");
const metadataRoutes = require("./routes/metadata-routes");

///// CONFIGS /////
//express
const app = express();

//cors
app.use(cors);

//bodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//network
const host = process.env.HOST;
const port = process.env.PORT;

//front
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const sessionConfig = {
  secret: process.env.SESSION_SECRET_KEY,
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
  // res.locals.currentUser = req.session.token;
  res.locals.currentUser = req.session.username;
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
app.use("/meta", metadataRoutes);

///// SERVER INIT /////
app.listen(port, host);
logger.info("****************** SERVER STARTED ************************");
logger.info("***************  http://%s:%s  ******************", host, port);

///// ERROR MIDDLEWARE /////
//executed if any other middleware yields an error
app.use(error);
