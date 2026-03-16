const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/cargo', reportController.cargoReport);
router.get('/delivery', reportController.deliveryReport);
router.get('/high-value', reportController.highValueReport);
router.get('/damaged', reportController.damagedReport);
router.get('/activity', reportController.activityReport);
router.get('/audit-logs', reportController.getAuditLogs);
router.get('/delayed', reportController.delayedReport);

router.get('/performance', reportController.performanceReport);

module.exports = router;
