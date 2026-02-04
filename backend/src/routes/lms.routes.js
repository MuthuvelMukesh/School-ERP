const express = require('express');
const { body } = require('express-validator');
const lmsController = require('../controllers/lms.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const fileManager = require('../utils/fileManager');

const router = express.Router();

const setLmsUploadType = (req, res, next) => {
  req.body.type = 'lms';
  next();
};

const lmsCreateValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('type')
    .notEmpty()
    .withMessage('Content type is required')
    .isIn(['LESSON_NOTE', 'VIDEO_LECTURE', 'ASSIGNMENT'])
    .withMessage('Invalid content type'),
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('subjectId').notEmpty().withMessage('Subject ID is required'),
  body('teacherId').notEmpty().withMessage('Teacher ID is required'),
  body('visibility')
    .optional()
    .isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
    .withMessage('Invalid visibility value'),
  body('totalMarks')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total marks must be a positive number')
];

// All routes require authentication
router.use(authenticate);

// LMS content routes
router.get('/', lmsController.getAllLmsContent);
router.get('/:id', lmsController.getLmsContentById);
router.post('/', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), lmsCreateValidation, validate, lmsController.createLmsContent);
router.put('/:id', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), lmsController.updateLmsContent);
router.delete('/:id', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), lmsController.deleteLmsContent);

// Attachment routes
router.post(
  '/:id/attachments',
  authorize('ADMIN', 'PRINCIPAL', 'TEACHER'),
  setLmsUploadType,
  fileManager.uploadMultipleFiles,
  lmsController.uploadLmsAttachments
);

router.delete(
  '/:id/attachments/:attachmentId',
  authorize('ADMIN', 'PRINCIPAL', 'TEACHER'),
  lmsController.deleteLmsAttachment
);

// Assignment submissions
router.get(
  '/:id/submissions',
  authorize('ADMIN', 'PRINCIPAL', 'TEACHER'),
  lmsController.getLmsSubmissions
);

router.get(
  '/:id/submissions/me',
  authorize('STUDENT'),
  lmsController.getMySubmission
);

router.get(
  '/submissions/me',
  authorize('STUDENT'),
  lmsController.getMySubmissions
);

router.post(
  '/:id/submissions',
  authorize('STUDENT'),
  setLmsUploadType,
  fileManager.uploadMultipleFiles,
  lmsController.createSubmission
);

router.put(
  '/:id/submissions/:submissionId',
  authorize('ADMIN', 'PRINCIPAL', 'TEACHER'),
  lmsController.gradeSubmission
);

router.get(
  '/:id/analytics',
  authorize('ADMIN', 'PRINCIPAL', 'TEACHER'),
  lmsController.getLmsAnalytics
);

module.exports = router;
