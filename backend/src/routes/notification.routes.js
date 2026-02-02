const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.post('/', authorize('ADMIN', 'PRINCIPAL', 'TEACHER'), notificationController.sendNotification);
router.get('/:id', notificationController.getNotificationById);

module.exports = router;
