const express = require('express');
const router = express.Router();
const officeController = require('../controllers/officeController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/', authenticate, officeController.getOffices);
router.get('/:id', authenticate, officeController.getOffice);
router.post('/', authenticate, authorize('ADMIN'), officeController.createOffice);
router.put('/:id', authenticate, authorize('ADMIN'), officeController.updateOffice);
router.delete('/:id', authenticate, authorize('ADMIN'), officeController.deleteOffice);

module.exports = router;
