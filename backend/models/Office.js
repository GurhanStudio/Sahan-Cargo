const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Office = sequelize.define('Office', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  office_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  office_type: {
    type: DataTypes.ENUM('ORIGIN_OFFICE', 'AIRPORT_CARGO', 'DESTINATION_AIRPORT', 'DESTINATION_OFFICE'),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(150),
    allowNull: false
  }
}, {
  tableName: 'offices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Office;
