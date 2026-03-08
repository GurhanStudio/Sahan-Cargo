const { AuditLog } = require('../models');

/**
 * Create an audit log entry
 */
async function createAuditLog({ userId, cargoId, actionType, actionDescription, ipAddress }) {
  try {
    await AuditLog.create({
      user_id: userId || null,
      cargo_id: cargoId || null,
      action_type: actionType,
      action_description: actionDescription,
      ip_address: ipAddress || null
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
}

module.exports = { createAuditLog };
