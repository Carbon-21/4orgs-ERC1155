var DataTypes = require("sequelize").DataTypes;
var _authenticationLog = require("./authentication_log");
var _users = require("./users");
var _usersActivity = require("./users_activity");

function initModels(sequelize) {
  var authenticationLog = _authenticationLog(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);
  var usersActivity = _usersActivity(sequelize, DataTypes);

  authenticationLog.belongsTo(users, { as: "user", foreignKey: "userId"});
  users.hasMany(authenticationLog, { as: "authenticationLogs", foreignKey: "userId"});
  usersActivity.belongsTo(users, { as: "user", foreignKey: "userId"});
  users.hasMany(usersActivity, { as: "usersActivities", foreignKey: "userId"});

  return {
    authenticationLog,
    users,
    usersActivity,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
