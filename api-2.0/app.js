"use strict";

///// REQUIRES /////
//npm packages
const express = require("express");

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
const chaincodeRoutes = require("./routes/chaincode-routes");
const renderRoutes = require("./routes/render-routes");

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

app.get("/", function (req, res) {
  res.render("home", { title: "Home", cssPath: "css/home.css" });
});

///// ROUTES /////
app.use("/auth", authRoutes);
app.use("/chaincode", chaincodeRoutes);
app.use("/", renderRoutes);

///// SERVER INIT /////
app.listen(port);
logger.info("****************** SERVER STARTED ************************");
logger.info("***************  http://%s:%s  ******************", host, port);

///// ERROR MIDDLEWARE /////
//executed if any other middleware yields an error
app.use(error);
