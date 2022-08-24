const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('usersActivity', {
    action: {
      type: DataTypes.CHAR(6),
      allowNull: false
    },
    actionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
      field: 'action_date'
    },
    actionUser: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'action_user'
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    cpf: {
      type: DataTypes.STRING(11),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    password: {
      type: DataTypes.STRING(60),
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'users_activity',
    timestamps: false,
    indexes: [
      {
        name: "user_id",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
