const express = require('express');
const examController = require('../controllers/exam.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// Exam schedules
router.get('/schedules', examController.getAllExamSchedules);
router.get('/schedules/:id', examController.getExamScheduleById);
router.post('/schedules', authorize('ADMIN', 'PRINCIPAL'), examController.createExamSchedule);
router.put('/schedules/:id', authorize('ADMIN', 'PRINCIPAL'), examController.updateExamSchedule);
router.delete('/schedules/:id', authorize('ADMIN'), examController.deleteExamSchedule);

// Exam results
router.get('/results', examController.getAllResults);
router.get('/results/exam/:examId', examController.getExamResults);
router.get('/results/student/:studentId', examController.getStudentResults);
router.post('/results', authorize('ADMIN', 'TEACHER'), examController.createResult);
router.put('/results/:id', authorize('ADMIN', 'TEACHER'), examController.updateResult);

// Report cards
router.get('/report-card/:studentId/:examId', examController.getReportCard);

module.exports = router;
