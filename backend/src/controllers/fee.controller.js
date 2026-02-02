const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

exports.getAllFeeStructures = async (req, res) => {
  try {
    const structures = await prisma.feeStructure.findMany({
      include: {
        academicYear: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { structures }
    });
  } catch (error) {
    logger.error('Get fee structures error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch fee structures'
    });
  }
};

exports.createFeeStructure = async (req, res) => {
  try {
    const data = req.body;

    const structure = await prisma.feeStructure.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Fee structure created successfully',
      data: { structure }
    });
  } catch (error) {
    logger.error('Create fee structure error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create fee structure'
    });
  }
};

exports.updateFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.dueDate) data.dueDate = new Date(data.dueDate);

    const structure = await prisma.feeStructure.update({
      where: { id },
      data
    });

    res.status(200).json({
      status: 'success',
      message: 'Fee structure updated successfully',
      data: { structure }
    });
  } catch (error) {
    logger.error('Update fee structure error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update fee structure'
    });
  }
};

exports.deleteFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.feeStructure.delete({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: 'Fee structure deleted successfully'
    });
  } catch (error) {
    logger.error('Delete fee structure error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete fee structure'
    });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              admissionNo: true
            }
          },
          feeStructure: true
        },
        orderBy: { paymentDate: 'desc' }
      }),
      prisma.feePayment.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        payments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get payments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payments'
    });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.feePayment.findUnique({
      where: { id },
      include: {
        student: true,
        feeStructure: true
      }
    });

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { payment }
    });
  } catch (error) {
    logger.error('Get payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payment'
    });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const data = req.body;

    // Generate receipt number
    const receiptNo = `REC${Date.now()}`;

    const payment = await prisma.feePayment.create({
      data: {
        ...data,
        receiptNo,
        collectedBy: req.user.id,
        paymentDate: new Date()
      },
      include: {
        student: true,
        feeStructure: true
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Payment recorded successfully',
      data: { payment }
    });
  } catch (error) {
    logger.error('Create payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record payment'
    });
  }
};

exports.getDefaulters = async (req, res) => {
  try {
    // Get students with pending or overdue fees
    const defaulters = await prisma.feePayment.findMany({
      where: {
        status: {
          in: ['PENDING', 'OVERDUE', 'PARTIAL']
        }
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            phone: true,
            class: true
          }
        },
        feeStructure: true
      },
      orderBy: { paymentDate: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { defaulters }
    });
  } catch (error) {
    logger.error('Get defaulters error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch defaulters'
    });
  }
};

exports.getStudentFeeDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    const payments = await prisma.feePayment.findMany({
      where: { studentId },
      include: {
        feeStructure: true
      },
      orderBy: { paymentDate: 'desc' }
    });

    // Calculate summary
    const totalPaid = payments.reduce((sum, p) => sum + (p.status === 'PAID' ? p.amount : 0), 0);
    const totalPending = payments.reduce((sum, p) => sum + (p.status !== 'PAID' ? p.amount : 0), 0);

    res.status(200).json({
      status: 'success',
      data: {
        payments,
        summary: {
          totalPaid,
          totalPending,
          totalPayments: payments.length
        }
      }
    });
  } catch (error) {
    logger.error('Get student fee details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch fee details'
    });
  }
};
