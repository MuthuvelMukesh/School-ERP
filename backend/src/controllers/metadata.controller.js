const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

exports.getClasses = async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        section: true,
        academicYearId: true
      },
      orderBy: { name: 'asc' }
    });

    res.status(200).json({
      status: 'success',
      data: { classes }
    });
  } catch (error) {
    logger.error('Get classes metadata error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch classes'
    });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const { classId, teacherId } = req.query;
    const where = {};

    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;

    const subjects = await prisma.subject.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        classId: true,
        teacherId: true
      },
      orderBy: { name: 'asc' }
    });

    res.status(200).json({
      status: 'success',
      data: { subjects }
    });
  } catch (error) {
    logger.error('Get subjects metadata error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch subjects'
    });
  }
};
