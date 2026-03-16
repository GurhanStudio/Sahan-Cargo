const { Office, User } = require('../models');
const { createAuditLog } = require('../middleware/auditLogger');

// GET /api/offices
exports.getOffices = async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { office_type: type } : {};
    const offices = await Office.findAll({
      where,
      include: [{
        model: User,
        as: 'users',
        attributes: ['id', 'name', 'role', 'is_active'],
        required: false
      }],
      order: [['office_type', 'ASC'], ['office_name', 'ASC']]
    });
    res.json(offices);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/offices/:id
exports.getOffice = async (req, res) => {
  try {
    const office = await Office.findByPk(req.params.id, {
      include: [{ model: User, as: 'users', attributes: ['id', 'name', 'role', 'is_active'], required: false }]
    });
    if (!office) return res.status(404).json({ message: 'Office not found.' });
    res.json(office);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/offices
exports.createOffice = async (req, res) => {
  try {
    const { office_name, office_type, location } = req.body;
    if (!office_name || !office_type || !location) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const office = await Office.create({ office_name, office_type, location });

    await createAuditLog({
      userId: req.user.id,
      actionType: 'OFFICE_CREATED',
      actionDescription: `Admin created office: ${office_name} (${office_type})`,
      ipAddress: req.ip
    });

    res.status(201).json(office);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/offices/:id
exports.updateOffice = async (req, res) => {
  try {
    const office = await Office.findByPk(req.params.id);
    if (!office) return res.status(404).json({ message: 'Office not found.' });

    const { office_name, office_type, location } = req.body;
    await office.update({
      office_name: office_name || office.office_name,
      office_type: office_type || office.office_type,
      location: location || office.location
    });

    await createAuditLog({
      userId: req.user.id,
      actionType: 'OFFICE_UPDATED',
      actionDescription: `Admin updated office ID ${office.id}: ${office.office_name}`,
      ipAddress: req.ip
    });

    res.json(office);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/offices/:id
exports.deleteOffice = async (req, res) => {
  try {
    const office = await Office.findByPk(req.params.id);
    if (!office) return res.status(404).json({ message: 'Office not found.' });

    await office.destroy();

    await createAuditLog({
      userId: req.user.id,
      actionType: 'OFFICE_DELETED',
      actionDescription: `Admin deleted office: ${office.office_name}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Office deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
