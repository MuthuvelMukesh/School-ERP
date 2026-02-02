const express = require('express');
const staffController = require('../controllers/staff.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'PRINCIPAL'), staffController.getAllStaff);
router.get('/:id', staffController.getStaffById);
router.post('/', authorize('ADMIN', 'PRINCIPAL'), staffController.createStaff);
router.put('/:id', authorize('ADMIN', 'PRINCIPAL'), staffController.updateStaff);
router.delete('/:id', authorize('ADMIN'), staffController.deleteStaff);

// Leave management
router.get('/:id/leaves', staffController.getStaffLeaves);
router.post('/:id/leaves', staffController.applyLeave);
router.put('/leaves/:leaveId', authorize('ADMIN', 'PRINCIPAL'), staffController.updateLeaveStatus);

module.exports = router;
