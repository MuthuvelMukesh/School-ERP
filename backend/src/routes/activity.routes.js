const express = require('express');
const activityController = require('../controllers/activity.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get recent activities (dashboard)
router.get('/recent', activityController.getRecentActivities);

// Get all activities with filters
router.get('/', activityController.getAllActivities);

// Get user activity summary
router.get('/user/:userId/summary', activityController.getUserActivitySummary);

// Get module statistics
router.get('/module/:module/stats', activityController.getModuleStats);

// Export activities as CSV
router.get('/export/csv', activityController.exportActivities);

// Get activity by ID
router.get('/:id', activityController.getActivityById);

// Delete old activities (admin only)
router.delete('/cleanup/old', activityController.cleanupOldActivities);

module.exports = router;
