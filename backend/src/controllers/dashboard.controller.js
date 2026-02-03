const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get comprehensive dashboard stats
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const role = req.user.role;
    let stats = {};

    if (['ADMIN', 'PRINCIPAL'].includes(role)) {
      // Admin/Principal dashboard with comprehensive stats
      const [
        totalStudents,
        totalStaff,
        totalClasses,
        recentPayments,
        totalFees,
        feesCollected,
        feesOverdue,
        attendanceStats
      ] = await Promise.all([
        prisma.student.count({ where: { isActive: true } }),
        prisma.staff.count({ where: { isActive: true } }),
        prisma.class.count(),
        prisma.fee.count({
          where: {
            paymentDate: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7))
            }
          }
        }),
        prisma.fee.aggregate({
          _sum: { amount: true }
        }),
        prisma.fee.aggregate({
          _sum: { amountPaid: true },
          where: { status: { in: ['PAID', 'PARTIAL'] } }
        }),
        prisma.fee.count({
          where: { status: 'OVERDUE' }
        }),
        getAttendanceStats()
      ]);

      stats = {
        students: {
          total: totalStudents,
          active: totalStudents
        },
        staff: {
          total: totalStaff,
          active: totalStaff
        },
        classes: {
          total: totalClasses
        },
        finance: {
          totalFees: totalFees._sum.amount || 0,
          collected: feesCollected._sum.amountPaid || 0,
          pending: (totalFees._sum.amount || 0) - (feesCollected._sum.amountPaid || 0),
          overdue: feesOverdue,
          recentPayments: recentPayments
        },
        attendance: attendanceStats
      };
    } else if (role === 'TEACHER') {
      // Teacher dashboard
      const teacherId = req.user.staff?.id;
      const classesTeaching = await prisma.class.findMany({
        where: { classTeacherId: teacherId },
        select: { id: true }
      });

      const classIds = classesTeaching.map(c => c.id);

      const [totalStudents, presentToday, absentToday] = await Promise.all([
        prisma.student.count({
          where: { classId: { in: classIds } }
        }),
        prisma.attendance.count({
          where: {
            classId: { in: classIds },
            status: 'PRESENT',
            date: new Date().toISOString().split('T')[0]
          }
        }),
        prisma.attendance.count({
          where: {
            classId: { in: classIds },
            status: 'ABSENT',
            date: new Date().toISOString().split('T')[0]
          }
        })
      ]);

      stats = {
        students: { total: totalStudents },
        attendance: { present: presentToday, absent: absentToday }
      };
    } else if (role === 'PARENT') {
      // Parent dashboard
      const userId = req.user.id;
      const parent = await prisma.parent.findFirst({
        where: { userId }
      });

      const childrenCount = await prisma.student.count({
        where: { parentId: parent?.id }
      });

      stats = {
        children: { total: childrenCount }
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

/**
 * Get attendance trend data (for charts)
 */
exports.getAttendanceTrends = async (req, res) => {
  try {
    const { classId, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where = {
      date: { gte: startDate.toISOString().split('T')[0] }
    };

    if (classId) {
      where.classId = classId;
    }

    const attendanceData = await prisma.attendance.groupBy({
      by: ['date', 'status'],
      where,
      _count: {
        id: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Format data for charts
    const chartData = {};
    attendanceData.forEach(record => {
      if (!chartData[record.date]) {
        chartData[record.date] = {};
      }
      chartData[record.date][record.status] = record._count.id;
    });

    const labels = Object.keys(chartData).sort();
    const datasets = {
      PRESENT: { label: 'Present', data: [], borderColor: 'rgb(75, 192, 75)' },
      ABSENT: { label: 'Absent', data: [], borderColor: 'rgb(255, 99, 99)' },
      LATE: { label: 'Late', data: [], borderColor: 'rgb(255, 193, 7)' },
      HALF_DAY: { label: 'Half Day', data: [], borderColor: 'rgb(156, 39, 176)' }
    };

    labels.forEach(date => {
      Object.keys(datasets).forEach(status => {
        datasets[status].data.push(chartData[date]?.[status] || 0);
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Attendance trends retrieved',
      data: {
        labels,
        datasets: Object.values(datasets)
      }
    });
  } catch (error) {
    logger.error('Get attendance trends error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch attendance trends'
    });
  }
};

/**
 * Get grade distribution data
 */
exports.getGradeDistribution = async (req, res) => {
  try {
    const { classId, examScheduleId } = req.query;

    const where = {};
    if (classId) {
      where.examSchedule = { classId };
    }
    if (examScheduleId) {
      where.examScheduleId = examScheduleId;
    }

    const results = await prisma.examResult.findMany({
      where,
      select: {
        marksObtained: true,
        subject: { select: { name: true } }
      }
    });

    // Group by subject and calculate distributions
    const distributions = {};

    results.forEach(result => {
      const subject = result.subject.name;
      if (!distributions[subject]) {
        distributions[subject] = {
          excellent: 0,  // 90-100
          good: 0,       // 75-89
          average: 0,    // 60-74
          below: 0       // <60
        };
      }

      const marks = result.marksObtained;
      if (marks >= 90) distributions[subject].excellent++;
      else if (marks >= 75) distributions[subject].good++;
      else if (marks >= 60) distributions[subject].average++;
      else distributions[subject].below++;
    });

    res.status(200).json({
      status: 'success',
      message: 'Grade distribution retrieved',
      data: distributions
    });
  } catch (error) {
    logger.error('Get grade distribution error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch grade distribution'
    });
  }
};

/**
 * Get financial analytics
 */
exports.getFinancialAnalytics = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get fee collection trends
    const feeData = await prisma.fee.groupBy({
      by: ['paymentDate'],
      where: {
        paymentDate: { gte: startDate },
        status: { in: ['PAID', 'PARTIAL'] }
      },
      _sum: {
        amountPaid: true
      },
      orderBy: { paymentDate: 'asc' }
    });

    // Get fee status breakdown
    const feeStatus = await prisma.fee.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true }
    });

    // Format response
    const monthlyData = {};
    feeData.forEach(record => {
      if (record.paymentDate) {
        const month = record.paymentDate.toISOString().split('T')[0].substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = 0;
        }
        monthlyData[month] += record._sum.amountPaid || 0;
      }
    });

    const statusBreakdown = {};
    feeStatus.forEach(record => {
      statusBreakdown[record.status] = {
        count: record._count.id,
        totalAmount: record._sum.amount || 0
      };
    });

    res.status(200).json({
      status: 'success',
      message: 'Financial analytics retrieved',
      data: {
        monthlyCollection: monthlyData,
        statusBreakdown: statusBreakdown
      }
    });
  } catch (error) {
    logger.error('Get financial analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch financial analytics'
    });
  }
};

/**
 * Get class performance analytics
 */
exports.getClassPerformance = async (req, res) => {
  try {
    const { classId } = req.query;

    const where = {};
    if (classId) {
      where.classId = classId;
    }

    // Get class statistics
    const classStats = await prisma.class.findMany({
      where,
      select: {
        id: true,
        name: true,
        section: true,
        _count: {
          select: { students: true, attendances: true }
        }
      }
    });

    // Get average marks per class
    const avgMarks = await prisma.examResult.groupBy({
      by: ['examSchedule'],
      where: {
        examSchedule: { classId: classId || undefined }
      },
      _avg: { marksObtained: true },
      _count: { id: true }
    });

    res.status(200).json({
      status: 'success',
      message: 'Class performance data retrieved',
      data: {
        classes: classStats,
        performance: avgMarks
      }
    });
  } catch (error) {
    logger.error('Get class performance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch class performance'
    });
  }
};

/**
 * Get recent activities
 */
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const activities = await prisma.activity.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        action: true,
        module: true,
        description: true,
        createdAt: true
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Recent activities retrieved',
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

/**
 * Helper function to calculate attendance stats
 */
async function getAttendanceStats() {
  const today = new Date().toISOString().split('T')[0];

  const [present, absent, late] = await Promise.all([
    prisma.attendance.count({
      where: { date: today, status: 'PRESENT' }
    }),
    prisma.attendance.count({
      where: { date: today, status: 'ABSENT' }
    }),
    prisma.attendance.count({
      where: { date: today, status: 'LATE' }
    })
  ]);

  const total = present + absent + late;
  const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

  return {
    present,
    absent,
    late,
    total,
    percentage
  };
}
