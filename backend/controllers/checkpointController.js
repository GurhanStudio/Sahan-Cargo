const { Cargo, CargoCheckpoint, User } = require('../models');
const { createAuditLog } = require('../middleware/auditLogger');

// Status flow order — checkpoints must follow this sequence
const STATUS_FLOW = [
  'REGISTERED',
  'RECEIVED_AT_ORIGIN_AIRPORT',
  'LOADED_ON_AIRCRAFT',
  'ARRIVED_AT_DESTINATION_AIRPORT',
  'RECEIVED_AT_DESTINATION_OFFICE',
  'DELIVERED'
];

// Which role can update which checkpoint
const ROLE_CHECKPOINT_MAP = {
  'ORIGIN_OFFICE': ['REGISTERED'],
  'AIRPORT_CARGO': ['RECEIVED_AT_ORIGIN_AIRPORT', 'LOADED_ON_AIRCRAFT'],
  'DESTINATION_AIRPORT': ['ARRIVED_AT_DESTINATION_AIRPORT'],
  'DESTINATION_OFFICE': ['RECEIVED_AT_DESTINATION_OFFICE'],
  'ADMIN': STATUS_FLOW  // Admin can do anything
};

// POST /api/checkpoint/:cargoId — Create checkpoint
exports.createCheckpoint = async (req, res) => {
  try {
    const { cargoId } = req.params;
    const { checkpoint_name, condition_status, note } = req.body;
    const userRole = req.user.role;

    // Find cargo
    const cargo = await Cargo.findByPk(cargoId);
    if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });

    // Validate checkpoint name
    if (!STATUS_FLOW.includes(checkpoint_name)) {
      return res.status(400).json({ message: 'Invalid checkpoint name.' });
    }

    // Check role permission for this checkpoint
    const allowedCheckpoints = ROLE_CHECKPOINT_MAP[userRole];
    if (!allowedCheckpoints || !allowedCheckpoints.includes(checkpoint_name)) {
      return res.status(403).json({
        message: `Your role (${userRole}) cannot update checkpoint: ${checkpoint_name}`
      });
    }

    // Enforce correct order — no status skipping
    const currentIndex = STATUS_FLOW.indexOf(cargo.current_status);
    const nextIndex = STATUS_FLOW.indexOf(checkpoint_name);

    if (nextIndex !== currentIndex + 1) {
      const expectedNext = STATUS_FLOW[currentIndex + 1] || 'NONE (already delivered)';
      return res.status(400).json({
        message: `Cannot skip to ${checkpoint_name}. Current status: ${cargo.current_status}. Expected next: ${expectedNext}`
      });
    }

    // Validate condition
    if (!['GOOD', 'DAMAGED', 'DISPUTE'].includes(condition_status)) {
      return res.status(400).json({ message: 'Condition must be GOOD, DAMAGED, or DISPUTE.' });
    }

    // DAMAGED or DISPUTE requires photo and note
    if ((condition_status === 'DAMAGED' || condition_status === 'DISPUTE') && (!req.file || !note)) {
      return res.status(400).json({
        message: 'Photo and note are required when condition is DAMAGED or DISPUTE.'
      });
    }

    // HIGH_VALUE cargo requires photo at every checkpoint
    if (cargo.priority === 'HIGH_VALUE' && !req.file) {
      return res.status(400).json({
        message: 'Photo is required at every checkpoint for HIGH_VALUE cargo.'
      });
    }

    const photo_url = req.file ? `/uploads/checkpoints/${req.file.filename}` : null;

    // Create checkpoint record
    const checkpoint = await CargoCheckpoint.create({
      cargo_id: cargoId,
      checkpoint_name,
      condition_status,
      note: note || null,
      photo_url,
      checked_by_user_id: req.user.id,
      checked_at: new Date()
    });

    // Update cargo status
    const updateData = { current_status: checkpoint_name };
    if (checkpoint_name === 'DELIVERED') {
      updateData.delivered_at = new Date();
    }
    await cargo.update(updateData);

    await createAuditLog({
      userId: req.user.id,
      cargoId: parseInt(cargoId),
      actionType: 'CHECKPOINT_CREATED',
      actionDescription: `Checkpoint ${checkpoint_name} (${condition_status}) for cargo ${cargo.tracking_number} by ${req.user.name}`,
      ipAddress: req.ip
    });

    res.status(201).json(checkpoint);
  } catch (error) {
    console.error('Create checkpoint error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/checkpoint/:cargoId — Get checkpoints for cargo
exports.getCheckpoints = async (req, res) => {
  try {
    const checkpoints = await CargoCheckpoint.findAll({
      where: { cargo_id: req.params.cargoId },
      include: [{ model: User, as: 'checkedBy', attributes: ['name', 'role'] }],
      order: [['checked_at', 'ASC']]
    });
    res.json(checkpoints);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
