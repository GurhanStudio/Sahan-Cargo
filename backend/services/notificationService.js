const { Notification } = require('../models');

/**
 * Create a targeted notification.
 * Target can be:
 *   - user_id (specific user)
 *   - target_role (all users of a role)
 *   - target_office_id (all users of an office)
 */
async function createNotification({ title, message, type = 'info', cargoId = null, userId = null, targetRole = null, targetOfficeId = null }) {
    try {
        await Notification.create({
            title,
            message,
            type,
            cargo_id: cargoId,
            user_id: userId,
            target_role: targetRole,
            target_office_id: targetOfficeId
        });
    } catch (err) {
        // Never crash the main flow because of notification failure
        console.error('Notification creation failed:', err.message);
    }
}

module.exports = { createNotification };
