const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, classId } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNo: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (classId) {
      where.classId = classId;
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          class: true,
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          user: {
            select: {
              email: true,
              isActive: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.student.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        students,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get students error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch students'
    });
  }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        parent: true,
        user: {
          select: {
            email: true,
            isActive: true,
            lastLogin: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { student }
    });
  } catch (error) {
    logger.error('Get student error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch student'
    });
  }
};

// Create student
exports.createStudent = async (req, res) => {
  try {
    const data = req.body;

    const student = await prisma.student.create({
      data: {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth)
      },
      include: {
        class: true,
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Student created successfully',
      data: { student }
    });
  } catch (error) {
    logger.error('Create student error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create student'
    });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }

    const student = await prisma.student.update({
      where: { id },
      data,
      include: {
        class: true,
        parent: true
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Student updated successfully',
      data: { student }
    });
  } catch (error) {
    logger.error('Update student error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update student'
    });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.student.delete({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: 'Student deleted successfully'
    });
  } catch (error) {
    logger.error('Delete student error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete student'
    });
  }
};

// Get students by class
exports.getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const students = await prisma.student.findMany({
      where: { classId },
      include: {
        user: {
          select: {
            email: true,
            isActive: true
          }
        }
      },
      orderBy: { firstName: 'asc' }
    });

    res.status(200).json({
      status: 'success',
      data: { students }
    });
  } catch (error) {
    logger.error('Get students by class error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch students'
    });
  }
};

// Get student attendance
exports.getStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const where = { studentId: id };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        class: true
      },
      orderBy: { date: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { attendance }
    });
  } catch (error) {
    logger.error('Get student attendance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch attendance'
    });
  }
};

// Get student fees
exports.getStudentFees = async (req, res) => {
  try {
    const { id } = req.params;

    const fees = await prisma.feePayment.findMany({
      where: { studentId: id },
      include: {
        feeStructure: true
      },
      orderBy: { paymentDate: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { fees }
    });
  } catch (error) {
    logger.error('Get student fees error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch fees'
    });
  }
};

// Get student results
exports.getStudentResults = async (req, res) => {
  try {
    const { id } = req.params;

    const results = await prisma.examResult.findMany({
      where: { studentId: id },
      include: {
        examSchedule: true,
        subject: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { results }
    });
  } catch (error) {
    logger.error('Get student results error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch results'
    });
  }
};
