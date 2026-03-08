const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Office } = require('../models');
const { createAuditLog } = require('../middleware/auditLogger');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Office, as: 'office', attributes: ['id', 'office_name', 'office_type'] }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, office_id: user.office_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await createAuditLog({
      userId: user.id,
      actionType: 'USER_LOGIN',
      actionDescription: `User ${user.name} logged in.`,
      ipAddress: req.ip
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        office_id: user.office_id,
        office: user.office
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Office, as: 'office', attributes: ['id', 'office_name', 'office_type'] }]
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
