const logger = require('../utils/logger');

const prisma = require('../utils/prisma');

exports.getAttendance = async (req, res) => {
  try {
    const { date, classId, studentId, page = 1, limit = 50 } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = Math.min(parseInt(limit), 200); // cap at 200
    const skip = (parsedPage - 1) * parsedLimit;

    const where = {};

    // Ownership enforcement for Student/Parent
    if (req.user?.role === 'STUDENT') {
      const studentProfile = await prisma.student.findUnique({
        where: { userId: req.user.id },
        select: { id: true }
      });
      where.studentId = studentProfile?.id || '__NO_STUDENT__';
    }

    if (req.user?.role === 'PARENT') {
      const parentProfile = await prisma.parent.findUnique({
        where: { userId: req.user.id },
        include: { students: { select: { id: true } } }
      });

      const childIds = parentProfile?.students?.map(s => s.id) || [];
      if (studentId) {
        if (!childIds.includes(studentId)) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied. You can only access your own data.'
          });
        }
        where.studentId = studentId;
      } else {
        where.studentId = { in: childIds.length > 0 ? childIds : ['__NO_CHILDREN__'] };
      }
    }
    if (date) where.date = new Date(date);
    if (classId) where.classId = classId;
    if (studentId && !['STUDENT', 'PARENT'].includes(req.user?.role)) where.studentId = studentId;

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNo: true
            }
          },
          class: true
        },
        orderBy: { date: 'desc' },
        skip,
        take: parsedLimit
      }),
      prisma.attendance.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        attendance,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit)
        }
      }
    });
  } catch (error) {
    logger.error('Get attendance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch attendance'
    });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { studentId, classId, date, status, remarks } = req.body;

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId,
          date: new Date(date)
        }
      },
      update: {
        status,
        remarks,
        markedBy: req.user.id
      },
      create: {
        studentId,
        classId,
        date: new Date(date),
        status,
        remarks,
        markedBy: req.user.id
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Attendance marked successfully',
      data: { attendance }
    });
  } catch (error) {
    logger.error('Mark attendance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark attendance'
    });
  }
};

exports.bulkMarkAttendance = async (req, res) => {
  try {
    const { classId, date, attendanceData } = req.body;
    // attendanceData: [{ studentId, status, remarks }]

    const attendanceRecords = await prisma.$transaction(
      attendanceData.map(data =>
        prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId: data.studentId,
              date: new Date(date)
            }
          },
          update: {
            status: data.status,
            remarks: data.remarks,
            markedBy: req.user.id
          },
          create: {
            studentId: data.studentId,
            classId,
            date: new Date(date),
            status: data.status,
            remarks: data.remarks,
            markedBy: req.user.id
          }
        })
      )
    );

    res.status(200).json({
      status: 'success',
      message: 'Bulk attendance marked successfully',
      data: { count: attendanceRecords.length }
    });
  } catch (error) {
    logger.error('Bulk mark attendance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark bulk attendance'
    });
  }
};

exports.getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    const attendance = await prisma.attendance.findMany({
      where: {
        classId,
        ...(date && { date: new Date(date) })
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { attendance }
    });
  } catch (error) {
    logger.error('Get class attendance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch class attendance'
    });
  }
};

exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const where = { studentId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    // Calculate statistics
    const stats = {
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      leave: attendance.filter(a => ['SICK_LEAVE', 'APPROVED_LEAVE'].includes(a.status)).length,
      total: attendance.length
    };

    res.status(200).json({
      status: 'success',
      data: {
        attendance,
        statistics: stats
      }
    });
  } catch (error) {
    logger.error('Get student attendance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch student attendance'
    });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        status,
        remarks
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Attendance updated successfully',
      data: { attendance }
    });
  } catch (error) {
    logger.error('Update attendance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update attendance'
    });
  }
};
