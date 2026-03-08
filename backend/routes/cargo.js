const express = require('express');
const router = express.Router();
const cargoController = require('../controllers/cargoController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { upload, setUploadType } = require('../middleware/upload');

// Dashboard stats (admin)
router.get('/dashboard/stats', authenticate, authorize('ADMIN'), cargoController.getDashboardStats);

// Public tracking
router.get('/track/:trackingNumber', cargoController.trackCargo);

// Protected routes
router.get('/', authenticate, cargoController.getCargos);
router.get('/:id', authenticate, cargoController.getCargoById);

// Register cargo (origin office only)
router.post('/',
  authenticate,
  authorize('ORIGIN_OFFICE', 'ADMIN'),
  setUploadType('cargo'),
  upload.single('photo'),
  cargoController.registerCargo
);

module.exports = router;
