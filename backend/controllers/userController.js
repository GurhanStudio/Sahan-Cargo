const bcrypt = require('bcryptjs');
const { User, Office, Cargo } = require('../models');
const { createAuditLog } = require('../middleware/auditLogger');

// GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{ model: Office, as: 'office', attributes: ['id', 'office_name', 'office_type'] }],
      order: [['created_at', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/users/:id
exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Office, as: 'office' }]
    });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, office_id } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hashedPassword, role, office_id: office_id || null });

    await createAuditLog({ userId: req.user.id, actionType: 'USER_CREATED', actionDescription: `Admin created user: ${name} (${role})`, ipAddress: req.ip });

    const result = user.toJSON();
    delete result.password;
    res.status(201).json(result);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const { name, email, phone, role, office_id, is_active, password } = req.body;
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(409).json({ message: 'Email already exists.' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (office_id !== undefined) updateData.office_id = office_id;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    await user.update(updateData);
    await createAuditLog({ userId: req.user.id, actionType: 'USER_UPDATED', actionDescription: `Admin updated user: ${user.name}`, ipAddress: req.ip });

    const result = user.toJSON();
    delete result.password;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// PATCH /api/users/:id/activate  — Re-activate a deactivated user
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.is_active) return res.status(400).json({ message: 'User is already active.' });

    await user.update({ is_active: true });
    await createAuditLog({ userId: req.user.id, actionType: 'USER_UPDATED', actionDescription: `Admin activated user: ${user.name}`, ipAddress: req.ip });

    res.json({ message: 'User activated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// PATCH /api/users/:id/deactivate  — Deactivate (soft disable) a user
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (!user.is_active) return res.status(400).json({ message: 'User is already inactive.' });

    await user.update({ is_active: false });
    await createAuditLog({ userId: req.user.id, actionType: 'USER_DEACTIVATED', actionDescription: `Admin deactivated user: ${user.name}`, ipAddress: req.ip });

    res.json({ message: 'User deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/users/:id  — Hard delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Safety: prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    const userName = user.name;
    await user.destroy();

    await createAuditLog({ userId: req.user.id, actionType: 'USER_UPDATED', actionDescription: `Admin permanently deleted user: ${userName}`, ipAddress: req.ip });

    res.json({ message: `User "${userName}" permanently deleted.` });
  } catch (error) {
    // Foreign key constraint error (has related cargo/checkpoints)
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({ message: 'Cannot delete user — they have linked cargo or checkpoint records. Deactivate instead.' });
    }
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
