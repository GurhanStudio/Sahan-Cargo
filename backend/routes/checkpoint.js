const express = require('express');
const router = express.Router();
const checkpointController = require('../controllers/checkpointController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { upload, setUploadType } = require('../middleware/upload');

router.use(authenticate);
router.use(authorize('ORIGIN_OFFICE', 'AIRPORT_CARGO', 'DESTINATION_AIRPORT', 'DESTINATION_OFFICE', 'ADMIN'));

router.get('/:cargoId', checkpointController.getCheckpoints);
router.post('/:cargoId',
  setUploadType('checkpoints'),
  upload.single('photo'),
  checkpointController.createCheckpoint
);

module.exports = router;
