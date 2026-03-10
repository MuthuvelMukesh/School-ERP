const express = require('express');
const feeController = require('../controllers/fee.controller');
const { authenticate, authorize, requireOwnership } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

// Fee structure
router.get('/structures', authorize('ADMIN', 'PRINCIPAL', 'ACCOUNTANT'), feeController.getAllFeeStructures);
router.post('/structures', authorize('ADMIN', 'ACCOUNTANT'), feeController.createFeeStructure);
router.put('/structures/:id', authorize('ADMIN', 'ACCOUNTANT'), feeController.updateFeeStructure);
router.delete('/structures/:id', authorize('ADMIN'), feeController.deleteFeeStructure);

// Fee payments
router.get('/payments', authorize('ADMIN', 'ACCOUNTANT', 'PRINCIPAL'), feeController.getAllPayments);
router.get('/payments/:id', authorize('ADMIN', 'PRINCIPAL', 'ACCOUNTANT'), feeController.getPaymentById);
router.post('/payments', authorize('ADMIN', 'ACCOUNTANT'), feeController.createPayment);
router.delete('/payments/:id', authorize('ADMIN', 'ACCOUNTANT'), feeController.deletePayment);
router.get('/defaulters', authorize('ADMIN', 'ACCOUNTANT', 'PRINCIPAL'), feeController.getDefaulters);
router.get('/student/:studentId', requireOwnership('studentId', ['ADMIN', 'PRINCIPAL', 'ACCOUNTANT', 'PARENT', 'STUDENT']), feeController.getStudentFeeDetails);

module.exports = router;
