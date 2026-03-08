const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReportDownloadLog = sequelize.define('ReportDownloadLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  admin_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  report_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  file_format: {
    type: DataTypes.ENUM('PDF', 'XLSX', 'CSV'),
    allowNull: false
  },
  filters_used: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'report_download_logs',
  timestamps: true,
  createdAt: 'downloaded_at',
  updatedAt: false
});

module.exports = ReportDownloadLog;
