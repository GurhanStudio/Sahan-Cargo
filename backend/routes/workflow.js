const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const wf = require('../controllers/cargoWorkflowController');

router.use(authenticate);

// Delayed cargo alerts — ADMIN and all operational roles
router.get('/delayed', authorize('ADMIN', 'DESTINATION_OFFICE', 'DESTINATION_AIRPORT', 'AIRPORT_CARGO', 'ORIGIN_OFFICE'), wf.getDelayedCargo);

module.exports = router;
