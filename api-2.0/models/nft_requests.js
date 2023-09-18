const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('nftRequests', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
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
    landOwner: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'land_owner'
    },
    landArea: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'land_area'
    },
    phyto: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    geolocation: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    certificate: {
      type: DataTypes.BLOB,
      allowNull: false
    },
    requestStatus: {
      type: DataTypes.ENUM('accepted','rejected','pending'),
      allowNull: false,
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
    tableName: 'nft_requests',
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
        name: "user_id",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
