const logger = require('../utils/logger');
const prisma = require('../utils/prisma');

/**
 * Create a salary payment for a staff member
 * POST /api/staff/:staffId/salary-payments
 */
exports.createSalaryPayment = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { month, amount, paymentDate, paymentMode, transactionId, remarks } = req.body;

    // Validate staff exists
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return res.status(404).json({ status: 'error', message: 'Staff member not found' });
    }

    const payment = await prisma.salaryPayment.create({
      data: {
        staffId,
        month,
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        paymentMode,
        transactionId: transactionId || null,
        remarks: remarks || null
      },
      include: {
        staff: { select: { firstName: true, lastName: true, employeeId: true } }
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Salary payment recorded successfully',
      data: { payment }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        status: 'error',
        message: 'Salary payment for this staff member and month already exists'
      });
    }
    logger.error('Create salary payment error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to record salary payment' });
  }
};

/**
 * Get salary payments for a specific staff member
 * GET /api/staff/:staffId/salary-payments
 */
exports.getStaffSalaryPayments = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { year, page = 1, limit = 12 } = req.query;

    const where = { staffId };
    if (year) {
      where.month = { startsWith: year };
    }

    const [payments, total] = await Promise.all([
      prisma.salaryPayment.findMany({
        where,
        include: {
          staff: { select: { firstName: true, lastName: true, employeeId: true } }
        },
        orderBy: { month: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.salaryPayment.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: { payments, total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    logger.error('Get staff salary payments error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch salary payments' });
  }
};

/**
 * Get all salary payments across all staff
 * GET /api/staff/salary-payments
 */
exports.getAllSalaryPayments = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 20 } = req.query;

    const where = {};
    if (month) where.month = month;
    else if (year) where.month = { startsWith: year };

    const [payments, total] = await Promise.all([
      prisma.salaryPayment.findMany({
        where,
        include: {
          staff: { select: { firstName: true, lastName: true, employeeId: true, designation: true } }
        },
        orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.salaryPayment.count({ where })
    ]);

    // Summary stats
    const totalPaid = await prisma.salaryPayment.aggregate({
      where,
      _sum: { amount: true }
    });

    res.status(200).json({
      status: 'success',
      data: {
        payments,
        total,
        totalAmount: totalPaid._sum.amount || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get all salary payments error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch salary payments' });
  }
};
