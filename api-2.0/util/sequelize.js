/* create a connection pool */

const Sequelize = require("sequelize");
const initModels = require("../models/init-models");

//.env
const sequelize = new Sequelize("carbon", "carbon", "12345678", {
  dialect: "mysql",
  host: "localhost",
});

const models = initModels(sequelize);
module.exports = models;
