const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

exports.getAllExamSchedules = async (req, res) => {
  try {
    const schedules = await prisma.examSchedule.findMany({
      include: {
        class: true,
        academicYear: true
      },
      orderBy: { startDate: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { schedules }
    });
  } catch (error) {
    logger.error('Get exam schedules error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch exam schedules'
    });
  }
};

exports.getExamScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await prisma.examSchedule.findUnique({
      where: { id },
      include: {
        class: true,
        academicYear: true,
        results: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNo: true
              }
            },
            subject: true
          }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({
        status: 'error',
        message: 'Exam schedule not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { schedule }
    });
  } catch (error) {
    logger.error('Get exam schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch exam schedule'
    });
  }
};

exports.createExamSchedule = async (req, res) => {
  try {
    const data = req.body;

    const schedule = await prisma.examSchedule.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate)
      },
      include: {
        class: true,
        academicYear: true
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Exam schedule created successfully',
      data: { schedule }
    });
  } catch (error) {
    logger.error('Create exam schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create exam schedule'
    });
  }
};

exports.updateExamSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    const schedule = await prisma.examSchedule.update({
      where: { id },
      data
    });

    res.status(200).json({
      status: 'success',
      message: 'Exam schedule updated successfully',
      data: { schedule }
    });
  } catch (error) {
    logger.error('Update exam schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update exam schedule'
    });
  }
};

exports.deleteExamSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.examSchedule.delete({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: 'Exam schedule deleted successfully'
    });
  } catch (error) {
    logger.error('Delete exam schedule error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete exam schedule'
    });
  }
};

exports.getAllResults = async (req, res) => {
  try {
    const results = await prisma.examResult.findMany({
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true
          }
        },
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
    logger.error('Get results error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch results'
    });
  }
};

exports.getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;

    const results = await prisma.examResult.findMany({
      where: { examScheduleId: examId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true
          }
        },
        subject: true
      },
      orderBy: { marksObtained: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { results }
    });
  } catch (error) {
    logger.error('Get exam results error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch exam results'
    });
  }
};

exports.getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;

    const results = await prisma.examResult.findMany({
      where: { studentId },
      include: {
        examSchedule: {
          include: {
            class: true,
            academicYear: true
          }
        },
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
      message: 'Failed to fetch student results'
    });
  }
};

exports.createResult = async (req, res) => {
  try {
    const data = req.body;

    const result = await prisma.examResult.create({
      data,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true
          }
        },
        examSchedule: true,
        subject: true
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Result created successfully',
      data: { result }
    });
  } catch (error) {
    logger.error('Create result error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create result'
    });
  }
};

exports.updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const result = await prisma.examResult.update({
      where: { id },
      data
    });

    res.status(200).json({
      status: 'success',
      message: 'Result updated successfully',
      data: { result }
    });
  } catch (error) {
    logger.error('Update result error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update result'
    });
  }
};

exports.getReportCard = async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    const [student, examSchedule, results] = await Promise.all([
      prisma.student.findUnique({
        where: { id: studentId },
        include: {
          class: true
        }
      }),
      prisma.examSchedule.findUnique({
        where: { id: examId }
      }),
      prisma.examResult.findMany({
        where: {
          studentId,
          examScheduleId: examId
        },
        include: {
          subject: true
        }
      })
    ]);

    // Calculate total and percentage
    const totalMarks = results.reduce((sum, r) => sum + r.marksObtained, 0);
    const maxMarks = examSchedule.totalMarks * results.length;
    const percentage = (totalMarks / maxMarks) * 100;

    res.status(200).json({
      status: 'success',
      data: {
        student,
        exam: examSchedule,
        results,
        summary: {
          totalMarks,
          maxMarks,
          percentage: percentage.toFixed(2),
          grade: percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F'
        }
      }
    });
  } catch (error) {
    logger.error('Get report card error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate report card'
    });
  }
};
