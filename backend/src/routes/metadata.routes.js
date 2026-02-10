const express = require('express');
const metadataController = require('../controllers/metadata.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/classes', metadataController.getClasses);
router.get('/subjects', metadataController.getSubjects);

module.exports = router;
