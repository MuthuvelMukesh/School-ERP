const logger = require('../utils/logger');

const prisma = require('../utils/prisma');

exports.getAcademicYears = async (req, res) => {
  try {
    const academicYears = await prisma.academicYear.findMany({
      select: {
        id: true,
        year: true,
        startDate: true,
        endDate: true,
        isCurrent: true
      },
      orderBy: { startDate: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { academicYears }
    });
  } catch (error) {
    logger.error('Get academic years metadata error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch academic years'
    });
  }
};

exports.createAcademicYear = async (req, res) => {
  try {
    const { year, startDate, endDate, isCurrent } = req.body;

    if (isCurrent) {
      // Unset any existing current year
      await prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false }
      });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        year,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: isCurrent || false
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Academic year created successfully',
      data: { academicYear }
    });
  } catch (error) {
    logger.error('Create academic year error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create academic year'
    });
  }
};

exports.updateAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, startDate, endDate, isCurrent } = req.body;

    if (isCurrent) {
      await prisma.academicYear.updateMany({
        where: { isCurrent: true, id: { not: id } },
        data: { isCurrent: false }
      });
    }

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: {
        ...(year && { year }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(isCurrent !== undefined && { isCurrent })
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Academic year updated successfully',
      data: { academicYear }
    });
  } catch (error) {
    logger.error('Update academic year error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update academic year'
    });
  }
};

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
