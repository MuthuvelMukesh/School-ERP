const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Core stats
router.get('/stats', dashboardController.getDashboardStats);

// Analytics endpoints
router.get('/analytics/attendance-trends', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), dashboardController.getAttendanceTrends);
router.get('/analytics/grade-distribution', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), dashboardController.getGradeDistribution);
router.get('/analytics/financial', authorize('ADMIN', 'PRINCIPAL', 'ACCOUNTANT'), dashboardController.getFinancialAnalytics);
router.get('/analytics/class-performance', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), dashboardController.getClassPerformance);

// Activity logs
router.get('/recent-activities', authorize('ADMIN', 'PRINCIPAL'), dashboardController.getRecentActivities);

module.exports = router;
