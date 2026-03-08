const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cargo = sequelize.define('Cargo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tracking_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  sender_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  sender_phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  receiver_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  receiver_phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('NORMAL', 'FRAGILE', 'HIGH_VALUE'),
    defaultValue: 'NORMAL'
  },
  current_status: {
    type: DataTypes.ENUM(
      'REGISTERED',
      'RECEIVED_AT_ORIGIN_AIRPORT',
      'LOADED_ON_AIRCRAFT',
      'ARRIVED_AT_DESTINATION_AIRPORT',
      'RECEIVED_AT_DESTINATION_OFFICE',
      'DELIVERED'
    ),
    defaultValue: 'REGISTERED'
  },
  origin_office_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'offices', key: 'id' }
  },
  destination_office_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'offices', key: 'id' }
  },
  photo_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  qr_code_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'cargos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Cargo;
