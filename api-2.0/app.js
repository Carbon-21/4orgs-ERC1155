"use strict";

///// REQUIRES /////
//npm packages
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const axios = require("axios").default;
const https = require("https");
const fs = require("fs");
var cronJob = require("cron").CronJob;

//native packages
const bodyParser = require("body-parser");
const path = require("path");

//local packages
const logger = require("./util/logger");
const cors = require("./middleware/cors");
const error = require("./middleware/error");
const { postTransparencyLog } = require("./controllers/ipfs-controller");

//routes
const authRoutes = require("./routes/auth-routes");
const ipfsRoutes = require("./routes/ipfs-routes");
const invokeRoutes = require("./routes/invoke-routes");
const queryRoutes = require("./routes/query-routes");
const frontRoutes = require("./routes/front-routes");
const metadataRoutes = require("./routes/metadata-routes");

///// CONFIGS /////
// TLS configs
const options = {
  key: fs.readFileSync(path.join(__dirname, "keys/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "keys/cert.pem")),
  passphrase: process.env.TLS_SECRET_KEY,
};

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
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // bypass certificate check (when using self-signed cert)

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
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.session.username;
  res.locals.currentRole = req.session.role;
  next();
});

app.get("/", function (req, res) {
  res.render("home", { title: "Home", cssPath: "css/home.css" });
});

//transparency log: post blockchain's tail every day at 00:00
// new cronJob("00 00 00 * * *", postTransparencyLog, null, true); // ss mm hh dd ww mm
// postTransparencyLog();

///// ROUTES /////
app.use("/auth", authRoutes);
app.use("/invoke", invokeRoutes);
app.use("/query", queryRoutes);
app.use("/", frontRoutes);
app.use("/meta", metadataRoutes);
app.use("/ipfs", ipfsRoutes);

///// ERROR MIDDLEWARE /////
//executed if any other middleware yields an error
app.use(error);

///// SERVER INIT /////
const httpsServer = https.createServer(options, app);
httpsServer.listen(port, host, () => {
  logger.info("****************** HTTPS SERVER STARTED ************************");
  logger.info("***************  https://%s:%s  *******************", host, port);
});
