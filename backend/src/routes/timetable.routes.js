const express = require('express');
const timetableController = require('../controllers/timetable.controller');
const { authenticate, authorize, requireOwnership } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), timetableController.getAllTimetables);
router.get('/class/:classId', timetableController.getClassTimetable);
router.get('/teacher/:teacherId', requireOwnership('teacherId', ['ADMIN', 'PRINCIPAL']), timetableController.getTeacherTimetable);
router.post('/', authorize('ADMIN', 'PRINCIPAL'), timetableController.createTimetable);
router.put('/:id', authorize('ADMIN', 'PRINCIPAL'), timetableController.updateTimetable);
router.delete('/:id', authorize('ADMIN', 'PRINCIPAL'), timetableController.deleteTimetable);

module.exports = router;
