const express = require('express');
const timetableController = require('../controllers/timetable.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', timetableController.getAllTimetables);
router.get('/class/:classId', timetableController.getClassTimetable);
router.get('/teacher/:teacherId', timetableController.getTeacherTimetable);
router.post('/', authorize('ADMIN', 'PRINCIPAL'), timetableController.createTimetable);
router.put('/:id', authorize('ADMIN', 'PRINCIPAL'), timetableController.updateTimetable);
router.delete('/:id', authorize('ADMIN', 'PRINCIPAL'), timetableController.deleteTimetable);

module.exports = router;
