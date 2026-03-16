const { Cargo, Office, OtpVerification, CargoCheckpoint } = require('../models');
const { generateOTP, sendOTP } = require('../utils/otpService');
const { createAuditLog } = require('../middleware/auditLogger');

// GET /api/receiver/cargo/:trackingNumber — Public cargo info for receiver
exports.getCargoForReceiver = async (req, res) => {
  try {
    const cargo = await Cargo.findOne({
      where: { tracking_number: req.params.trackingNumber },
      attributes: [
        'id', 'tracking_number', 'sender_name', 'receiver_name',
        'description', 'current_status', 'receiver_phone'
      ],
      include: [
        { model: Office, as: 'destinationOffice', attributes: ['office_name', 'location'] }
      ]
    });

    if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });
    res.json(cargo);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/receiver/request-otp — Request OTP for delivery confirmation
exports.requestOTP = async (req, res) => {
  try {
    const { tracking_number } = req.body;
    if (!tracking_number) {
      return res.status(400).json({ message: 'Tracking number is required.' });
    }

    const cargo = await Cargo.findOne({ where: { tracking_number } });
    if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });

    // Cargo must be at destination office
    if (cargo.current_status !== 'RECEIVED_AT_DESTINATION_OFFICE') {
      return res.status(400).json({
        message: `Cargo has not reached destination office yet. Current status: ${cargo.current_status}`
      });
    }

    // Cargo must not already be delivered
    if (cargo.current_status === 'DELIVERED') {
      return res.status(400).json({ message: 'Cargo is already delivered.' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OtpVerification.create({
      cargo_id: cargo.id,
      receiver_phone: cargo.receiver_phone,
      otp_code: otp,
      expires_at: expiresAt,
      verified: false
    });

    // Send OTP (mock)
    await sendOTP(cargo.receiver_phone, otp);

    res.json({ message: 'OTP sent to receiver phone number.', phone: cargo.receiver_phone });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/receiver/verify-otp — Verify OTP and complete delivery
exports.verifyOTP = async (req, res) => {
  try {
    const { tracking_number, otp_code } = req.body;

    if (!tracking_number || !otp_code) {
      return res.status(400).json({ message: 'Tracking number and OTP code are required.' });
    }

    const cargo = await Cargo.findOne({ where: { tracking_number } });
    if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });

    if (cargo.current_status === 'DELIVERED') {
      return res.status(400).json({ message: 'Cargo is already delivered.' });
    }

    if (cargo.current_status !== 'RECEIVED_AT_DESTINATION_OFFICE') {
      return res.status(400).json({
        message: 'Cargo has not reached destination office yet.'
      });
    }

    // Find valid OTP
    const otpRecord = await OtpVerification.findOne({
      where: {
        cargo_id: cargo.id,
        otp_code,
        verified: false
      },
      order: [['created_at', 'DESC']]
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid OTP code.' });
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Mark OTP as verified
    await otpRecord.update({ verified: true });

    // Create DELIVERED checkpoint
    await CargoCheckpoint.create({
      cargo_id: cargo.id,
      checkpoint_name: 'DELIVERED',
      condition_status: 'GOOD',
      note: 'Delivery confirmed by receiver via OTP verification.',
      checked_by_user_id: null, // Receiver-initiated — no staff user
      checked_at: new Date()
    });

    // Update cargo status to DELIVERED
    await cargo.update({
      current_status: 'DELIVERED',
      delivered_at: new Date()
    });

    await createAuditLog({
      userId: null,
      cargoId: cargo.id,
      actionType: 'DELIVERY_CONFIRMED',
      actionDescription: `Cargo ${tracking_number} delivered. OTP verified by receiver phone ${cargo.receiver_phone}.`,
      ipAddress: req.ip
    });

    res.json({ message: 'Delivery confirmed successfully!', cargo_status: 'DELIVERED' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
