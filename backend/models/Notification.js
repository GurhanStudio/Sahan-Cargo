const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    // Who should see this — null means broadcast to role
    user_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    // Role-targeted notification (ADMIN, ORIGIN_OFFICE, etc.)
    target_role: { type: DataTypes.STRING(50), allowNull: true },
    // Office-targeted (only users in this office see it)
    target_office_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'offices', key: 'id' } },
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: {
        type: DataTypes.ENUM('info', 'success', 'warning', 'danger'),
        defaultValue: 'info'
    },
    cargo_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'cargos', key: 'id' } },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    read_at: { type: DataTypes.DATE, allowNull: true }
}, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Notification;
