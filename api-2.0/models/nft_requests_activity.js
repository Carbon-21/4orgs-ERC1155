const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('nftRequestsActivity', {
    action: {
      type: DataTypes.CHAR(6),
      allowNull: false
    },
    actionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('current_timestamp'),
      field: 'action_date'
    },
    requestId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'nft_requests',
        key: 'id'
      },
      field: 'request_id'
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    landOwner: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'land_owner'
    },
    landArea: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'land_area'
    },
    phyto: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    geolocation: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    certificate: {
      type: DataTypes.BLOB,
      allowNull: true
    },
    requestStatus: {
      type: DataTypes.ENUM('accepted','rejected','pending'),
      allowNull: true,
      defaultValue: "pending",
      field: 'request_status'
    },
    userNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_notes'
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_notes'
    }
  }, {
    sequelize,
    tableName: 'nft_requests_activity',
    timestamps: false,
    indexes: [
      {
        name: "request_id",
        using: "BTREE",
        fields: [
          { name: "request_id" },
        ]
      },
    ]
  });
};
