const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const paymentService = require('../utils/paymentService');
const activityService = require('../utils/activity');

const prisma = new PrismaClient();

/**
 * Check payment gateway availability
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const isConfigured = paymentService.isRazorpayConfigured();

    res.status(200).json({
      status: 'success',
      data: {
        paymentGatewayConfigured: isConfigured,
        provider: isConfigured ? 'razorpay' : null,
        message: isConfigured
          ? 'Payment gateway is ready'
          : 'Payment gateway is not configured'
      }
    });
  } catch (error) {
    logger.error('Error checking payment status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check payment status'
    });
  }
};

/**
 * Create payment order
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    if (!paymentService.isRazorpayConfigured()) {
      return res.status(503).json({
        status: 'error',
        message: 'Payment gateway is not configured'
      });
    }

    const { feeId, studentId, amount } = req.body;

    // Validate fee exists
    const fee = await prisma.fee.findUnique({
      where: { id: feeId },
      include: {
        student: {
          include: { user: true }
        }
      }
    });

    if (!fee) {
      return res.status(404).json({
        status: 'error',
        message: 'Fee record not found'
      });
    }

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    });

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    // Create order
    const orderData = {
      studentId: student.id,
      amount,
      description: `School Fees - ${fee.type || 'Fee Payment'}`,
      studentEmail: student.user.email,
      studentName: `${student.firstName} ${student.lastName}`
    };

    const order = await paymentService.createPaymentOrder(orderData);

    // Log activity
    await activityService.logActivity(
      req.user.id,
      'PAYMENT_INITIATED',
      'PAYMENT',
      'fees',
      `Payment order created for amount ${amount}`,
      {
        ipAddress: req.ip,
        resourceId: feeId,
        resourceType: 'fee',
        changes: { orderId: order.orderId },
        status: 'SUCCESS'
      }
    );

    res.status(201).json({
      status: 'success',
      message: 'Payment order created',
      data: {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        studentId: order.studentId,
        studentEmail: order.studentEmail,
        studentName: order.studentName,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    logger.error('Error creating payment order:', error);

    await activityService.logActivity(
      req.user.id,
      'PAYMENT_INITIATED',
      'PAYMENT',
      'fees',
      'Payment order creation failed',
      {
        ipAddress: req.ip,
        status: 'FAILED'
      }
    );

    res.status(500).json({
      status: 'error',
      message: 'Failed to create payment order'
    });
  }
};

/**
 * Verify payment and update fee status
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, feeId } = req.body;

    // Verify signature
    const isSignatureValid = paymentService.verifyPaymentSignature({
      orderId,
      paymentId,
      signature
    });

    if (!isSignatureValid) {
      logger.warn(`Invalid payment signature for order: ${orderId}`);
      
      await activityService.logActivity(
        req.user.id,
        'PAYMENT_VERIFICATION_FAILED',
        'PAYMENT',
        'fees',
        'Payment verification failed - invalid signature',
        {
          changes: { paymentId, orderId },
          status: 'FAILED'
        }
      );

      return res.status(400).json({
        status: 'error',
        message: 'Payment verification failed'
      });
    }

    // Get payment details
    const paymentDetails = await paymentService.getPaymentDetails(paymentId);

    if (paymentDetails.status !== 'captured') {
      return res.status(400).json({
        status: 'error',
        message: 'Payment not captured'
      });
    }

    // Update fee record
    const fee = await prisma.fee.update({
      where: { id: feeId },
      data: {
        amountPaid: {
          increment: paymentDetails.amount
        },
        status: 'PAID',
        paymentMethod: 'ONLINE',
        paymentDate: new Date(),
        notes: `Online payment via Razorpay - Transaction ID: ${paymentId}`
      }
    });

    // Log activity
    await activityService.logActivity(
      req.user.id,
      'PAYMENT_COMPLETED',
      'PAYMENT',
      'fees',
      `Payment completed - Amount: ${paymentDetails.amount}`,
      {
        ipAddress: req.ip,
        resourceId: feeId,
        resourceType: 'fee',
        changes: {
          paymentId,
          amount: paymentDetails.amount,
          status: 'PAID'
        },
        status: 'SUCCESS'
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Payment verified and recorded',
      data: {
        paymentId: paymentDetails.id,
        amount: paymentDetails.amount,
        status: paymentDetails.status,
        fee: fee
      }
    });
  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify payment'
    });
  }
};

/**
 * Get payment history for a student
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      prisma.fee.findMany({
        where: {
          studentId,
          paymentDate: { not: null }
        },
        orderBy: { paymentDate: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          type: true,
          amount: true,
          amountPaid: true,
          status: true,
          paymentDate: true,
          paymentMethod: true,
          notes: true
        }
      }),
      prisma.fee.count({
        where: {
          studentId,
          paymentDate: { not: null }
        }
      })
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Payment history retrieved',
      data: {
        payments,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching payment history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payment history'
    });
  }
};

/**
 * Refund payment (admin only)
 */
exports.refundPayment = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'ACCOUNTANT') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins and accountants can process refunds'
      });
    }

    const { paymentId, feeId, amount, reason } = req.body;

    // Get fee details
    const fee = await prisma.fee.findUnique({
      where: { id: feeId }
    });

    if (!fee) {
      return res.status(404).json({
        status: 'error',
        message: 'Fee record not found'
      });
    }

    // Process refund
    const refund = await paymentService.refundPayment(paymentId, amount);

    // Update fee record
    const updatedFee = await prisma.fee.update({
      where: { id: feeId },
      data: {
        amountPaid: {
          decrement: amount || fee.amountPaid
        },
        status: amount < fee.amountPaid ? 'PARTIAL' : 'PENDING',
        notes: `Refund processed - ID: ${refund.id}. Reason: ${reason || 'Not specified'}`
      }
    });

    // Log activity
    await activityService.logActivity(
      req.user.id,
      'PAYMENT_REFUNDED',
      'PAYMENT',
      'fees',
      `Refund processed - Amount: ${amount || fee.amountPaid}`,
      {
        ipAddress: req.ip,
        resourceId: feeId,
        resourceType: 'fee',
        changes: {
          refundId: refund.id,
          amount: amount || fee.amountPaid,
          reason
        },
        status: 'SUCCESS'
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Refund processed successfully',
      data: {
        refund,
        fee: updatedFee
      }
    });
  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process refund'
    });
  }
};

/**
 * Get payment report (admin only)
 */
exports.getPaymentReport = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'ACCOUNTANT') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins and accountants can access this resource'
      });
    }

    const { startDate, endDate, skip = 0, count = 50 } = req.query;

    const report = await paymentService.getPaymentReports({
      startDate,
      endDate,
      skip: parseInt(skip),
      count: parseInt(count)
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment report retrieved',
      data: report
    });
  } catch (error) {
    logger.error('Error generating payment report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate payment report'
    });
  }
};
