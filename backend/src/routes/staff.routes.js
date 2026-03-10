const express = require('express');
const staffController = require('../controllers/staff.controller');
const salaryPaymentController = require('../controllers/salaryPayment.controller');
const { authenticate, authorize, requireOwnership } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'PRINCIPAL'), staffController.getAllStaff);
router.get('/:id', requireOwnership('id', ['ADMIN', 'PRINCIPAL']), staffController.getStaffById);
router.post('/', authorize('ADMIN', 'PRINCIPAL'), staffController.createStaff);
router.put('/:id', authorize('ADMIN', 'PRINCIPAL'), staffController.updateStaff);
router.delete('/:id', authorize('ADMIN'), staffController.deleteStaff);

// Leave management
router.get('/:id/leaves', requireOwnership('id', ['ADMIN', 'PRINCIPAL']), staffController.getStaffLeaves);
router.post('/:id/leaves', requireOwnership('id', ['ADMIN', 'PRINCIPAL']), staffController.applyLeave);
router.put('/leaves/:leaveId', authorize('ADMIN', 'PRINCIPAL'), staffController.updateLeaveStatus);

// Salary payment management
router.get('/salary-payments', authorize('ADMIN', 'PRINCIPAL', 'ACCOUNTANT'), salaryPaymentController.getAllSalaryPayments);
router.get('/:staffId/salary-payments', authorize('ADMIN', 'PRINCIPAL', 'ACCOUNTANT'), salaryPaymentController.getStaffSalaryPayments);
router.post('/:staffId/salary-payments', authorize('ADMIN', 'ACCOUNTANT'), salaryPaymentController.createSalaryPayment);

module.exports = router;
