const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// Core stats
router.get('/stats', dashboardController.getDashboardStats);

// Analytics endpoints
router.get('/analytics/attendance-trends', dashboardController.getAttendanceTrends);
router.get('/analytics/grade-distribution', dashboardController.getGradeDistribution);
router.get('/analytics/financial', dashboardController.getFinancialAnalytics);
router.get('/analytics/class-performance', dashboardController.getClassPerformance);

// Activity logs
router.get('/recent-activities', dashboardController.getRecentActivities);

module.exports = router;
