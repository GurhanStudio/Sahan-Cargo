const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CargoCheckpoint = sequelize.define('CargoCheckpoint', {
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
  checkpoint_name: {
    type: DataTypes.ENUM(
      'REGISTERED',
      'RECEIVED_AT_ORIGIN_AIRPORT',
      'LOADED_ON_AIRCRAFT',
      'ARRIVED_AT_DESTINATION_AIRPORT',
      'RECEIVED_AT_DESTINATION_OFFICE',
      'DELIVERED'
    ),
    allowNull: false
  },
  condition_status: {
    type: DataTypes.ENUM('GOOD', 'DAMAGED', 'DISPUTE'),
    allowNull: false
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  photo_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  checked_by_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  checked_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'cargo_checkpoints',
  timestamps: false
});

module.exports = CargoCheckpoint;
