const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/officeVerificationController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const OPS_ROLES = ['ORIGIN_OFFICE', 'AIRPORT_CARGO', 'DESTINATION_AIRPORT', 'DESTINATION_OFFICE'];

router.get('/daily', authenticate, authorize(...OPS_ROLES), ctrl.getDailyCargo);
router.get('/summary', authenticate, authorize('ADMIN'), ctrl.getVerificationSummary);
router.post('/:cargoId', authenticate, authorize(...OPS_ROLES), ctrl.verifyCargo);

module.exports = router;
