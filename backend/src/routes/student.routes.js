const express = require('express');
const { body } = require('express-validator');
const studentController = require('../controllers/student.controller');
const { authenticate, authorize, requireOwnership, authorizePermission } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

const promoteValidation = [
	body('studentIds').isArray({ min: 1 }).withMessage('studentIds must be a non-empty array'),
	body('studentIds.*').isString().notEmpty().withMessage('Each studentId must be valid'),
	body('toClassId').isString().notEmpty().withMessage('toClassId is required'),
	body('reason').optional().isString(),
	body('remarks').optional().isString()
];

const detainValidation = [
	body('studentIds').isArray({ min: 1 }).withMessage('studentIds must be a non-empty array'),
	body('studentIds.*').isString().notEmpty().withMessage('Each studentId must be valid'),
	body('reason').optional().isString(),
	body('remarks').optional().isString()
];

const transferValidation = [
	body('studentId').isString().notEmpty().withMessage('studentId is required'),
	body('transferType').isIn(['INTERNAL', 'EXTERNAL']).withMessage('transferType must be INTERNAL or EXTERNAL'),
	body('toClassId').optional().isString(),
	body('toSchoolName').optional().isString(),
	body('toSchoolAddress').optional().isString(),
	body('transferDate').optional().isISO8601().withMessage('transferDate must be a valid date'),
	body('reason').optional().isString(),
	body('remarks').optional().isString()
];

// Promotion / detention / transfer
router.post('/promotions', authorizePermission('students.promote', ['ADMIN', 'PRINCIPAL']), promoteValidation, validate, studentController.promoteStudents);
router.post('/detentions', authorizePermission('students.detain', ['ADMIN', 'PRINCIPAL']), detainValidation, validate, studentController.detainStudents);
router.post('/transfers', authorizePermission('students.transfer', ['ADMIN', 'PRINCIPAL']), transferValidation, validate, studentController.transferStudent);
router.get('/:id/progress-history', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), studentController.getStudentProgressHistory);

// Student CRUD operations
router.get('/', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), studentController.getAllStudents);
router.get('/:id', requireOwnership('id', ['ADMIN', 'PRINCIPAL', 'TEACHER']), studentController.getStudentById);
router.post('/', authorize('ADMIN', 'PRINCIPAL'), studentController.createStudent);
router.put('/:id', authorize('ADMIN', 'PRINCIPAL'), studentController.updateStudent);
router.delete('/:id', authorize('ADMIN'), studentController.deleteStudent);

// Additional endpoints
router.get('/class/:classId', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), studentController.getStudentsByClass);
router.get('/:id/attendance', requireOwnership('id', ['ADMIN', 'PRINCIPAL', 'TEACHER']), studentController.getStudentAttendance);
router.get('/:id/fees', requireOwnership('id', ['ADMIN', 'PRINCIPAL', 'ACCOUNTANT']), studentController.getStudentFees);
router.get('/:id/results', requireOwnership('id', ['ADMIN', 'PRINCIPAL', 'TEACHER']), studentController.getStudentResults);

module.exports = router;
