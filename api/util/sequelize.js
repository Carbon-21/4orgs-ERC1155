/* create a connection pool */
//disclaimer: sequelize obj/connection do mysql is only created once, even if "models" is used multiple times

const Sequelize = require("sequelize");
const initModels = require("../models/init-models");

const sequelize = new Sequelize("carbon", "carbon", process.env.MYSQL_PASSWORD, {
  dialect: "mysql",
  host: "localhost",
});

const models = initModels(sequelize);
module.exports = models;
