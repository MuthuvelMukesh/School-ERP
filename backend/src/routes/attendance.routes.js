const express = require('express');
const attendanceController = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), attendanceController.getAttendance);
router.post('/', authorize('ADMIN', 'TEACHER'), attendanceController.markAttendance);
router.post('/bulk', authorize('ADMIN', 'TEACHER'), attendanceController.bulkMarkAttendance);
router.get('/class/:classId', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), attendanceController.getClassAttendance);
router.get('/student/:studentId', attendanceController.getStudentAttendance);
router.put('/:id', authorize('ADMIN', 'TEACHER'), attendanceController.updateAttendance);

module.exports = router;
