const { Cargo, Office, User, CargoCheckpoint } = require('../models');
const { generateTrackingNumber } = require('../utils/trackingNumber');
const { generateQRCode } = require('../utils/qrGenerator');
const { createAuditLog } = require('../middleware/auditLogger');
const { Op } = require('sequelize');

// POST /api/cargo — Register new cargo (Origin Office only)
exports.registerCargo = async (req, res) => {
  try {
    const {
      sender_name, sender_phone, receiver_name, receiver_phone,
      description, weight, origin_office_id, destination_office_id, priority
    } = req.body;

    // Validation
    if (!sender_name || !sender_phone || !receiver_name || !receiver_phone ||
        !description || !weight || !origin_office_id || !destination_office_id) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    // HIGH_VALUE requires photo
    if (priority === 'HIGH_VALUE' && !req.file) {
      return res.status(400).json({ message: 'Photo is mandatory for HIGH_VALUE cargo.' });
    }

    // Generate tracking number (ensure unique)
    let tracking_number;
    let exists = true;
    while (exists) {
      tracking_number = generateTrackingNumber();
      exists = await Cargo.findOne({ where: { tracking_number } });
    }

    // Generate QR code
    const qr_code_url = await generateQRCode(tracking_number);

    const photo_url = req.file ? `/uploads/cargo/${req.file.filename}` : null;

    const cargo = await Cargo.create({
      tracking_number,
      sender_name,
      sender_phone,
      receiver_name,
      receiver_phone,
      description,
      weight,
      priority: priority || 'NORMAL',
      current_status: 'REGISTERED',
      origin_office_id,
      destination_office_id,
      photo_url,
      qr_code_url,
      created_by: req.user.id
    });

    // Create initial checkpoint
    await CargoCheckpoint.create({
      cargo_id: cargo.id,
      checkpoint_name: 'REGISTERED',
      condition_status: 'GOOD',
      photo_url,
      checked_by_user_id: req.user.id,
      checked_at: new Date()
    });

    await createAuditLog({
      userId: req.user.id,
      cargoId: cargo.id,
      actionType: 'CARGO_REGISTERED',
      actionDescription: `Cargo ${tracking_number} registered. Priority: ${priority || 'NORMAL'}. From office ${origin_office_id} to ${destination_office_id}.`,
      ipAddress: req.ip
    });

    res.status(201).json(cargo);
  } catch (error) {
    console.error('Register cargo error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/cargo — List cargo (role-filtered)
exports.getCargos = async (req, res) => {
  try {
    const { status, priority, from, to, search, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) where.current_status = status;
    if (priority) where.priority = priority;
    if (from && to) {
      where.created_at = { [Op.between]: [new Date(from), new Date(to + 'T23:59:59')] };
    }
    if (search) {
      where[Op.or] = [
        { tracking_number: { [Op.like]: `%${search}%` } },
        { sender_name: { [Op.like]: `%${search}%` } },
        { receiver_name: { [Op.like]: `%${search}%` } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'ORIGIN_OFFICE') {
      where.origin_office_id = req.user.office_id;
    } else if (req.user.role === 'DESTINATION_OFFICE') {
      where.destination_office_id = req.user.office_id;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Cargo.findAndCountAll({
      where,
      include: [
        { model: Office, as: 'originOffice', attributes: ['office_name', 'location'] },
        { model: Office, as: 'destinationOffice', attributes: ['office_name', 'location'] },
        { model: User, as: 'creator', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      cargos: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (error) {
    console.error('Get cargos error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/cargo/:id — Cargo detail with checkpoints
exports.getCargoById = async (req, res) => {
  try {
    const cargo = await Cargo.findByPk(req.params.id, {
      include: [
        { model: Office, as: 'originOffice' },
        { model: Office, as: 'destinationOffice' },
        { model: User, as: 'creator', attributes: ['name', 'email'] },
        {
          model: CargoCheckpoint,
          as: 'checkpoints',
          include: [{ model: User, as: 'checkedBy', attributes: ['name', 'role'] }],
          order: [['checked_at', 'ASC']]
        }
      ]
    });

    if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });
    res.json(cargo);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/cargo/track/:trackingNumber — Public tracking
exports.trackCargo = async (req, res) => {
  try {
    const cargo = await Cargo.findOne({
      where: { tracking_number: req.params.trackingNumber },
      include: [
        { model: Office, as: 'originOffice', attributes: ['office_name', 'location'] },
        { model: Office, as: 'destinationOffice', attributes: ['office_name', 'location'] },
        {
          model: CargoCheckpoint,
          as: 'checkpoints',
          attributes: ['checkpoint_name', 'condition_status', 'checked_at', 'note'],
          include: [{ model: User, as: 'checkedBy', attributes: ['name'] }],
          order: [['checked_at', 'ASC']]
        }
      ]
    });

    if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });
    res.json(cargo);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/cargo/dashboard/stats — Dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const total = await Cargo.count();
    const delivered = await Cargo.count({ where: { current_status: 'DELIVERED' } });
    const inTransit = await Cargo.count({
      where: {
        current_status: {
          [Op.notIn]: ['REGISTERED', 'DELIVERED']
        }
      }
    });
    const highValue = await Cargo.count({ where: { priority: 'HIGH_VALUE' } });
    const disputes = await CargoCheckpoint.count({ where: { condition_status: 'DISPUTE' } });
    const damaged = await CargoCheckpoint.count({ where: { condition_status: 'DAMAGED' } });

    // Recent cargo (last 10)
    const recentCargo = await Cargo.findAll({
      include: [
        { model: Office, as: 'originOffice', attributes: ['office_name'] },
        { model: Office, as: 'destinationOffice', attributes: ['office_name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Recent disputes
    const recentDisputes = await CargoCheckpoint.findAll({
      where: { condition_status: { [Op.in]: ['DAMAGED', 'DISPUTE'] } },
      include: [
        { model: Cargo, as: 'cargo', attributes: ['tracking_number', 'priority'] },
        { model: User, as: 'checkedBy', attributes: ['name'] }
      ],
      order: [['checked_at', 'DESC']],
      limit: 10
    });

    res.json({
      stats: { total, delivered, inTransit, highValue, disputes, damaged },
      recentCargo,
      recentDisputes
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
