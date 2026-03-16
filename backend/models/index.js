const sequelize = require('../config/database');
const Office = require('./Office');
const User = require('./User');
const Cargo = require('./Cargo');
const CargoCheckpoint = require('./CargoCheckpoint');
const OtpVerification = require('./OtpVerification');
const AuditLog = require('./AuditLog');
const ReportDownloadLog = require('./ReportDownloadLog');
const OfficeVerification = require('./OfficeVerification');
const Notification = require('./Notification');

// ── Associations ──

// Office <-> User
Office.hasMany(User, { foreignKey: 'office_id', as: 'users' });
User.belongsTo(Office, { foreignKey: 'office_id', as: 'office' });

// Office <-> Cargo
Office.hasMany(Cargo, { foreignKey: 'origin_office_id', as: 'originCargos' });
Office.hasMany(Cargo, { foreignKey: 'destination_office_id', as: 'destinationCargos' });
Cargo.belongsTo(Office, { foreignKey: 'origin_office_id', as: 'originOffice' });
Cargo.belongsTo(Office, { foreignKey: 'destination_office_id', as: 'destinationOffice' });

// User <-> Cargo (creator)
User.hasMany(Cargo, { foreignKey: 'created_by', as: 'createdCargos' });
Cargo.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Cargo <-> CargoCheckpoint
Cargo.hasMany(CargoCheckpoint, { foreignKey: 'cargo_id', as: 'checkpoints' });
CargoCheckpoint.belongsTo(Cargo, { foreignKey: 'cargo_id', as: 'cargo' });

// User <-> CargoCheckpoint
User.hasMany(CargoCheckpoint, { foreignKey: 'checked_by_user_id', as: 'checkpoints' });
CargoCheckpoint.belongsTo(User, { foreignKey: 'checked_by_user_id', as: 'checkedBy' });

// Cargo <-> OtpVerification
Cargo.hasMany(OtpVerification, { foreignKey: 'cargo_id', as: 'otpVerifications' });
OtpVerification.belongsTo(Cargo, { foreignKey: 'cargo_id', as: 'cargo' });

// User <-> AuditLog
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Cargo <-> AuditLog
Cargo.hasMany(AuditLog, { foreignKey: 'cargo_id', as: 'auditLogs' });
AuditLog.belongsTo(Cargo, { foreignKey: 'cargo_id', as: 'cargo' });

// User <-> ReportDownloadLog
User.hasMany(ReportDownloadLog, { foreignKey: 'admin_user_id', as: 'reportDownloads' });
ReportDownloadLog.belongsTo(User, { foreignKey: 'admin_user_id', as: 'admin' });

// Cargo <-> OfficeVerification
Cargo.hasMany(OfficeVerification, { foreignKey: 'cargo_id', as: 'officeVerifications' });
OfficeVerification.belongsTo(Cargo, { foreignKey: 'cargo_id', as: 'cargo' });

// Office <-> OfficeVerification
Office.hasMany(OfficeVerification, { foreignKey: 'office_id', as: 'officeVerifications' });
OfficeVerification.belongsTo(Office, { foreignKey: 'office_id', as: 'office' });

// User <-> OfficeVerification
User.hasMany(OfficeVerification, { foreignKey: 'verified_by_user_id', as: 'officeVerifications' });
OfficeVerification.belongsTo(User, { foreignKey: 'verified_by_user_id', as: 'verifiedBy' });

// Notification associations
Notification.belongsTo(require('./User'), { foreignKey: 'user_id', as: 'targetUser', constraints: false });
Notification.belongsTo(require('./Cargo'), { foreignKey: 'cargo_id', as: 'cargo', constraints: false });

module.exports = {
  sequelize,
  Office,
  User,
  Cargo,
  CargoCheckpoint,
  OtpVerification,
  AuditLog,
  ReportDownloadLog,
  OfficeVerification,
  Notification
};
