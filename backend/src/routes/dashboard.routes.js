const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/stats', dashboardController.getDashboardStats);
router.get('/recent-activities', dashboardController.getRecentActivities);

module.exports = router;
