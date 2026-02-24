const express = require('express');
const examController = require('../controllers/exam.controller');
const { authenticate, authorize, requireOwnership } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// Exam schedules
router.get('/schedules', authorize('ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'), examController.getAllExamSchedules);
router.get('/schedules/:id', authorize('ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'), examController.getExamScheduleById);
router.post('/schedules', authorize('ADMIN', 'PRINCIPAL'), examController.createExamSchedule);
router.put('/schedules/:id', authorize('ADMIN', 'PRINCIPAL'), examController.updateExamSchedule);
router.delete('/schedules/:id', authorize('ADMIN'), examController.deleteExamSchedule);

// Exam results
router.get('/results', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), examController.getAllResults);
router.get('/results/exam/:examId', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), examController.getExamResults);
router.get('/results/student/:studentId', requireOwnership('studentId', ['ADMIN', 'PRINCIPAL', 'TEACHER']), examController.getStudentResults);
router.post('/results', authorize('ADMIN', 'TEACHER'), examController.createResult);
router.put('/results/:id', authorize('ADMIN', 'TEACHER'), examController.updateResult);

// Report cards
router.get('/report-card/:studentId/:examId', requireOwnership('studentId', ['ADMIN', 'PRINCIPAL', 'TEACHER']), examController.getReportCard);

module.exports = router;
