const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OfficeVerification = sequelize.define('OfficeVerification', {
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
    office_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'offices', key: 'id' }
    },
    verified_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    verified_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'office_verifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = OfficeVerification;
