const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OtpVerification = sequelize.define('OtpVerification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  cargo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'cargos', key: 'id' }
  },
  receiver_phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  otp_code: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'otp_verifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = OtpVerification;
