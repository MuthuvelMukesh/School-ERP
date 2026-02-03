const express = require('express');
const { body } = require('express-validator');
const fileController = require('../controllers/file.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const fileManager = require('../utils/fileManager');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const uploadValidation = [
  body('documentType').notEmpty().withMessage('Document type is required'),
  body('studentId').optional().notEmpty().withMessage('Student ID is required'),
  body('staffId').optional().notEmpty().withMessage('Staff ID is required')
];

// Upload routes
router.post(
  '/upload/student',
  fileManager.uploadSingleFile,
  uploadValidation,
  validate,
  fileController.uploadStudentDocument
);

router.post(
  '/upload/staff',
  fileManager.uploadSingleFile,
  uploadValidation,
  validate,
  fileController.uploadStaffDocument
);

// Download route
router.get('/download/:filePath(*)', fileController.downloadFile);

// Delete route
router.delete('/delete/:filePath(*)', fileController.deleteFile);

// Admin routes
router.get('/stats', fileController.getUploadStats);
router.post('/cleanup', fileController.cleanupOldFiles);

module.exports = router;
