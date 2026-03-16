const { Notification, Cargo } = require('../models');
const { Op } = require('sequelize');

// GET /api/notifications — get notifications for logged-in user
exports.getMyNotifications = async (req, res) => {
    try {
        const { id: userId, role, office_id } = req.user;

        const where = {
            [Op.or]: [
                { user_id: userId },
                { target_role: role, user_id: null },
                ...(office_id ? [{ target_office_id: office_id, user_id: null }] : [])
            ]
        };

        const notifications = await Notification.findAll({
            where,
            include: [{ model: Cargo, as: 'cargo', attributes: ['tracking_number'], required: false }],
            order: [['created_at', 'DESC']],
            limit: 40
        });

        const unreadCount = notifications.filter(n => !n.is_read).length;
        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
    try {
        const n = await Notification.findByPk(req.params.id);
        if (!n) return res.status(404).json({ message: 'Notification not found.' });
        await n.update({ is_read: true, read_at: new Date() });
        res.json({ message: 'Marked as read.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res) => {
    try {
        const { id: userId, role, office_id } = req.user;
        await Notification.update(
            { is_read: true, read_at: new Date() },
            {
                where: {
                    is_read: false,
                    [Op.or]: [
                        { user_id: userId },
                        { target_role: role, user_id: null },
                        ...(office_id ? [{ target_office_id: office_id, user_id: null }] : [])
                    ]
                }
            }
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};
