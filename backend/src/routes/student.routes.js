const express = require('express');
const studentController = require('../controllers/student.controller');
const { authenticate, authorize, requireOwnership } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

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
