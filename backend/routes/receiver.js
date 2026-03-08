const express = require('express');
const router = express.Router();
const receiverController = require('../controllers/receiverController');

// All receiver routes are public (no login required)
router.get('/cargo/:trackingNumber', receiverController.getCargoForReceiver);
router.post('/request-otp', receiverController.requestOTP);
router.post('/verify-otp', receiverController.verifyOTP);

module.exports = router;
