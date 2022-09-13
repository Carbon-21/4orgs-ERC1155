const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('users', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    cpf: {
      type: DataTypes.STRING(11),
      allowNull: true,
      unique: "cpf"
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "email"
    },
    password: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    seed: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    salt: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    org: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Carbon"
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: "registering"
    },
    updateUser: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "self",
      field: 'update_user'
    }
  }, {
    sequelize,
    tableName: 'users',
    hasTrigger: true,
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "email",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "cpf",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "cpf" },
        ]
      },
    ]
  });
};
