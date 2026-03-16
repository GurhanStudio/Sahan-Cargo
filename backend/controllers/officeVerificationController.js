const { OfficeVerification, Cargo, Office, User, CargoCheckpoint } = require('../models');
const { Op } = require('sequelize');

// Role → which cargo to show (based on checkpoint name for that side)
const ROLE_CHECKPOINT_MAP = {
    ORIGIN_OFFICE: ['REGISTERED', 'RECEIVED_AT_ORIGIN_AIRPORT'],
    AIRPORT_CARGO: ['RECEIVED_AT_ORIGIN_AIRPORT', 'LOADED_ON_AIRCRAFT'],
    DESTINATION_AIRPORT: ['ARRIVED_AT_DESTINATION_AIRPORT', 'LOADED_ON_AIRCRAFT'],
    DESTINATION_OFFICE: ['RECEIVED_AT_DESTINATION_OFFICE', 'ARRIVED_AT_DESTINATION_AIRPORT']
};

// GET /api/office-verifications/daily
// Returns last-24h cargo relevant to the logged-in user's office/role
exports.getDailyCargo = async (req, res) => {
    try {
        const { role, office_id } = req.user;

        // Business-day window: 5:00 AM today → 4:59:59 AM tomorrow
        const now = new Date();
        const businessDayStart = new Date(now);
        businessDayStart.setHours(5, 0, 0, 0);
        if (now < businessDayStart) {
            // Before 5AM → use yesterday 5AM as start
            businessDayStart.setDate(businessDayStart.getDate() - 1);
        }
        const businessDayEnd = new Date(businessDayStart);
        businessDayEnd.setDate(businessDayEnd.getDate() + 1); // exactly +24h (next 5AM)

        const checkpointNames = ROLE_CHECKPOINT_MAP[role];

        if (!checkpointNames) {
            return res.status(403).json({ message: 'This feature is not available for your role.' });
        }

        // Find cargos that have a checkpoint matching this role's responsibility in the business day window
        const checkpoints = await CargoCheckpoint.findAll({
            where: {
                checkpoint_name: { [Op.in]: checkpointNames },
                checked_at: { [Op.between]: [businessDayStart, businessDayEnd] }
            },
            attributes: ['cargo_id'],
            raw: true
        });

        const cargoIds = [...new Set(checkpoints.map(c => c.cargo_id))];

        if (cargoIds.length === 0) {
            return res.json({ cargos: [] });
        }

        // Load those cargos with full info + existing office verification by this office
        const cargos = await Cargo.findAll({
            where: { id: { [Op.in]: cargoIds } },
            include: [
                { model: Office, as: 'originOffice', attributes: ['office_name'] },
                { model: Office, as: 'destinationOffice', attributes: ['office_name'] },
                {
                    model: OfficeVerification,
                    as: 'officeVerifications',
                    required: false,
                    where: { office_id },
                    include: [{ model: User, as: 'verifiedBy', attributes: ['name'] }]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({ cargos });
    } catch (error) {
        console.error('Get daily cargo error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// POST /api/office-verifications/:cargoId
// Mark a cargo as verified from this office
exports.verifyCargo = async (req, res) => {
    try {
        const { cargoId } = req.params;
        const { note } = req.body;
        const { id: userId, office_id, role } = req.user;

        if (!ROLE_CHECKPOINT_MAP[role]) {
            return res.status(403).json({ message: 'Not authorized.' });
        }

        // Check cargo exists
        const cargo = await Cargo.findByPk(cargoId);
        if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });

        // Prevent duplicate verification from same office
        const existing = await OfficeVerification.findOne({
            where: { cargo_id: cargoId, office_id }
        });

        if (existing) {
            return res.status(409).json({
                message: 'Already verified by this office.',
                verification: existing
            });
        }

        const verification = await OfficeVerification.create({
            cargo_id: cargoId,
            office_id,
            verified_by_user_id: userId,
            verified_at: new Date(),
            note: note || null
        });

        // Load with user info
        const full = await OfficeVerification.findByPk(verification.id, {
            include: [{ model: User, as: 'verifiedBy', attributes: ['name'] }]
        });

        res.status(201).json({ message: 'Cargo verified successfully.', verification: full });
    } catch (error) {
        console.error('Verify cargo error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// GET /api/office-verifications/summary  (ADMIN only)
// Returns today's verification counts per office
exports.getVerificationSummary = async (req, res) => {
    try {
        const now = new Date();
        const businessDayStart = new Date(now);
        businessDayStart.setHours(5, 0, 0, 0);
        if (now < businessDayStart) {
            businessDayStart.setDate(businessDayStart.getDate() - 1);
        }
        const businessDayEnd = new Date(businessDayStart);
        businessDayEnd.setDate(businessDayEnd.getDate() + 1);

        const verifications = await OfficeVerification.findAll({
            where: { verified_at: { [Op.between]: [businessDayStart, businessDayEnd] } },
            include: [
                { model: Office, as: 'office', attributes: ['id', 'office_name', 'office_type'] },
                { model: User, as: 'verifiedBy', attributes: ['name'] }
            ],
            order: [['verified_at', 'DESC']]
        });

        // Group by office
        const byOffice = {};
        verifications.forEach(v => {
            const key = v.office?.id;
            if (!key) return;
            if (!byOffice[key]) {
                byOffice[key] = {
                    office_id: key,
                    office_name: v.office.office_name,
                    office_type: v.office.office_type,
                    count: 0,
                    verifiers: []
                };
            }
            byOffice[key].count++;
            const name = v.verifiedBy?.name;
            if (name && !byOffice[key].verifiers.includes(name)) {
                byOffice[key].verifiers.push(name);
            }
        });

        res.json({
            date: businessDayStart.toLocaleDateString(),
            total_verifications: verifications.length,
            offices: Object.values(byOffice)
        });
    } catch (error) {
        console.error('Verification summary error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};
