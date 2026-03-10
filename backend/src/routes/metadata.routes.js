const express = require('express');
const metadataController = require('../controllers/metadata.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/classes', metadataController.getClasses);
router.get('/subjects', metadataController.getSubjects);
router.get('/academic-years', metadataController.getAcademicYears);
router.post('/academic-years', authorize('ADMIN', 'PRINCIPAL'), metadataController.createAcademicYear);
router.put('/academic-years/:id', authorize('ADMIN', 'PRINCIPAL'), metadataController.updateAcademicYear);

module.exports = router;
