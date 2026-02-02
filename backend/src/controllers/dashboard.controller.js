const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
  try {
    const role = req.user.role;

    let stats = {};

    if (['ADMIN', 'PRINCIPAL'].includes(role)) {
      // Admin/Principal dashboard
      const [totalStudents, totalStaff, totalClasses, recentPayments] = await Promise.all([
        prisma.student.count({ where: { isActive: true } }),
        prisma.staff.count({ where: { isActive: true } }),
        prisma.class.count(),
        prisma.feePayment.count({
          where: {
            paymentDate: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7))
            }
          }
        })
      ]);

      stats = {
        totalStudents,
        totalStaff,
        totalClasses,
        recentPayments
      };
    }

    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard stats'
    });
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const activities = [];
    
    res.status(200).json({
      status: 'success',
      data: { activities }
    });
  } catch (error) {
    logger.error('Get recent activities error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch recent activities'
    });
  }
};
