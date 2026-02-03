/**
 * Payment Service - Razorpay Integration
 * Handles online fee payments, refunds, and payment tracking
 */

const crypto = require('crypto');
const logger = require('./logger');

let razorpay = null;

// Initialize Razorpay client
const initializeRazorpay = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      const Razorpay = require('razorpay');
      razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      logger.info('Razorpay client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Razorpay:', error.message);
    }
  } else {
    logger.warn('Razorpay credentials not configured. Payment gateway will be unavailable.');
  }
};

// Initialize on module load
initializeRazorpay();

/**
 * Create a payment order
 * @param {Object} paymentData - Payment details
 */
exports.createPaymentOrder = async (paymentData) => {
  if (!razorpay) {
    throw new Error('Razorpay is not configured');
  }

  try {
    const { studentId, amount, description, studentEmail, studentName } = paymentData;

    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to paise (Razorpay uses smallest currency unit)
      currency: 'INR',
      receipt: `${studentId}-${Date.now()}`,
      description,
      notes: {
        studentId,
        studentName,
        paymentType: 'fee'
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    logger.info(`Payment order created: ${order.id}`, {
      studentId,
      amount,
      orderId: order.id
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      studentId,
      studentEmail,
      studentName
    };
  } catch (error) {
    logger.error('Error creating payment order:', error.message);
    throw error;
  }
};

/**
 * Verify payment signature (webhook verification)
 * @param {Object} paymentDetails - Payment response from Razorpay
 */
exports.verifyPaymentSignature = (paymentDetails) => {
  try {
    const { orderId, paymentId, signature } = paymentDetails;

    // Create signature from order_id and payment_id
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${orderId}|${paymentId}`);
    const generatedSignature = shasum.digest('hex');

    const isSignatureValid = generatedSignature === signature;

    if (isSignatureValid) {
      logger.info(`Payment signature verified: ${paymentId}`);
      return true;
    } else {
      logger.warn(`Invalid payment signature for: ${paymentId}`);
      return false;
    }
  } catch (error) {
    logger.error('Error verifying payment signature:', error.message);
    return false;
  }
};

/**
 * Get payment details
 * @param {string} paymentId - Razorpay payment ID
 */
exports.getPaymentDetails = async (paymentId) => {
  if (!razorpay) {
    throw new Error('Razorpay is not configured');
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId);

    return {
      id: payment.id,
      orderId: payment.order_id,
      amount: payment.amount / 100, // Convert from paise to rupees
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      vpa: payment.vpa,
      email: payment.email,
      contact: payment.contact,
      createdAt: new Date(payment.created_at * 1000),
      notes: payment.notes
    };
  } catch (error) {
    logger.error('Error fetching payment details:', error.message);
    throw error;
  }
};

/**
 * Refund payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Refund amount in rupees (optional)
 */
exports.refundPayment = async (paymentId, amount = null) => {
  if (!razorpay) {
    throw new Error('Razorpay is not configured');
  }

  try {
    const refundOptions = {};
    if (amount) {
      refundOptions.amount = Math.round(amount * 100); // Convert to paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);

    logger.info(`Payment refunded: ${paymentId}`, {
      refundId: refund.id,
      amount: amount || 'full'
    });

    return {
      id: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount / 100,
      status: refund.status,
      createdAt: new Date(refund.created_at * 1000)
    };
  } catch (error) {
    logger.error('Error refunding payment:', error.message);
    throw error;
  }
};

/**
 * Create invoice for payment
 * @param {Object} invoiceData - Invoice details
 */
exports.createInvoice = async (invoiceData) => {
  if (!razorpay) {
    throw new Error('Razorpay is not configured');
  }

  try {
    const {
      studentId,
      studentEmail,
      studentName,
      amount,
      description,
      dueDate
    } = invoiceData;

    const invoiceOptions = {
      customer_notify: 1,
      email_notify: 1,
      type: 'invoice',
      description,
      amount: Math.round(amount * 100),
      currency: 'INR',
      customer_details: {
        name: studentName,
        email: studentEmail
      },
      line_items: [{
        item_name: 'School Fees',
        description,
        amount: Math.round(amount * 100),
        currency: 'INR',
        quantity: 1
      }],
      notes: {
        studentId,
        invoiceType: 'fee_payment'
      },
      expire_by: Math.floor(new Date(dueDate).getTime() / 1000)
    };

    const invoice = await razorpay.invoices.create(invoiceOptions);

    logger.info(`Invoice created: ${invoice.id}`, {
      studentId,
      amount,
      invoiceId: invoice.id
    });

    return {
      id: invoice.id,
      orderId: invoice.order_id,
      studentId,
      amount: invoice.amount / 100,
      currency: invoice.currency,
      status: invoice.status,
      shortUrl: invoice.short_url,
      expiresAt: new Date(invoice.expire_by * 1000)
    };
  } catch (error) {
    logger.error('Error creating invoice:', error.message);
    throw error;
  }
};

/**
 * Get payment reconciliation report
 * @param {Object} filters - Filter options
 */
exports.getPaymentReports = async (filters = {}) => {
  if (!razorpay) {
    throw new Error('Razorpay is not configured');
  }

  try {
    const options = {
      skip: filters.skip || 0,
      count: filters.count || 100,
      from: filters.startDate ? Math.floor(new Date(filters.startDate).getTime() / 1000) : null,
      to: filters.endDate ? Math.floor(new Date(filters.endDate).getTime() / 1000) : null
    };

    // Remove null values
    Object.keys(options).forEach(key => {
      if (options[key] === null) delete options[key];
    });

    const payments = await razorpay.payments.all(options);

    // Format response
    const formattedPayments = payments.items.map(payment => ({
      id: payment.id,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      createdAt: new Date(payment.created_at * 1000),
      notes: payment.notes
    }));

    // Calculate summary
    const summary = {
      totalPayments: payments.items.length,
      totalAmount: formattedPayments.reduce((sum, p) => sum + (p.status === 'captured' ? p.amount : 0), 0),
      capturedCount: formattedPayments.filter(p => p.status === 'captured').length,
      failedCount: formattedPayments.filter(p => p.status === 'failed').length
    };

    return {
      payments: formattedPayments,
      summary,
      hasMore: payments.items.length === options.count
    };
  } catch (error) {
    logger.error('Error fetching payment reports:', error.message);
    throw error;
  }
};

/**
 * Check if Razorpay is configured
 */
exports.isRazorpayConfigured = () => {
  return razorpay !== null;
};

module.exports = exports;
