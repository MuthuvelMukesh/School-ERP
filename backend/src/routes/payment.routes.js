const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize, requireOwnership, requireBodyOwnership } = require('../middleware/auth.middleware');
const { validate, sanitizeNumber } = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createOrderValidation = [
  body('feeId').notEmpty().withMessage('Fee ID is required'),
  body('studentId').notEmpty().withMessage('Student ID is required'),
  sanitizeNumber('amount')
];

const verifyPaymentValidation = [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('signature').notEmpty().withMessage('Signature is required'),
  body('feeId').notEmpty().withMessage('Fee ID is required')
];

const refundValidation = [
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('feeId').notEmpty().withMessage('Fee ID is required'),
  sanitizeNumber('amount').optional(),
  body('reason').optional().trim()
];

// Routes

/**
 * Check payment gateway status
 * GET /api/payments/status
 */
router.get('/status', paymentController.getPaymentStatus);

/**
 * Create payment order
 * POST /api/payments/create-order
 */
router.post(
  '/create-order',
  authorize('ADMIN', 'PRINCIPAL', 'ACCOUNTANT', 'STUDENT', 'PARENT'),
  requireBodyOwnership('studentId', ['ADMIN', 'PRINCIPAL', 'ACCOUNTANT']),
  createOrderValidation,
  validate,
  paymentController.createPaymentOrder
);

/**
 * Verify payment
 * POST /api/payments/verify
 */
router.post(
  '/verify',
  authorize('ADMIN', 'PRINCIPAL', 'ACCOUNTANT', 'STUDENT', 'PARENT'),
  verifyPaymentValidation,
  validate,
  paymentController.verifyPayment
);

/**
 * Get payment history for a student
 * GET /api/payments/history/:studentId
 */
router.get(
  '/history/:studentId',
  requireOwnership('studentId', ['ADMIN', 'PRINCIPAL', 'ACCOUNTANT']),
  paymentController.getPaymentHistory
);

/**
 * Refund payment (admin/accountant only)
 * POST /api/payments/refund
 */
router.post(
  '/refund',
  authorize('ADMIN', 'ACCOUNTANT'),
  refundValidation,
  validate,
  paymentController.refundPayment
);

/**
 * Get payment report (admin/accountant only)
 * GET /api/payments/report
 */
router.get(
  '/report',
  authorize('ADMIN', 'PRINCIPAL', 'ACCOUNTANT'),
  paymentController.getPaymentReport
);

module.exports = router;
