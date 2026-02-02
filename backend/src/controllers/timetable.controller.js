const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

exports.getAllTimetables = async (req, res) => {
  try {
    const timetables = await prisma.timetable.findMany({
      include: {
        class: true,
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    res.status(200).json({
      status: 'success',
      data: { timetables }
    });
  } catch (error) {
    logger.error('Get timetables error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch timetables'
    });
  }
};

exports.getClassTimetable = async (req, res) => {
  try {
    const { classId } = req.params;

    const timetables = await prisma.timetable.findMany({
      where: { classId },
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    res.status(200).json({
      status: 'success',
      data: { timetables }
    });
  } catch (error) {
    logger.error('Get class timetable error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch class timetable'
    });
  }
};

exports.getTeacherTimetable = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const timetables = await prisma.timetable.findMany({
      where: { teacherId },
      include: {
        class: true,
        subject: true
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    res.status(200).json({
      status: 'success',
      data: { timetables }
    });
  } catch (error) {
    logger.error('Get teacher timetable error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch teacher timetable'
    });
  }
};

exports.createTimetable = async (req, res) => {
  try {
    const data = req.body;

    const timetable = await prisma.timetable.create({
      data,
      include: {
        class: true,
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Timetable created successfully',
      data: { timetable }
    });
  } catch (error) {
    logger.error('Create timetable error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create timetable'
    });
  }
};

exports.updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const timetable = await prisma.timetable.update({
      where: { id },
      data,
      include: {
        class: true,
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Timetable updated successfully',
      data: { timetable }
    });
  } catch (error) {
    logger.error('Update timetable error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update timetable'
    });
  }
};

exports.deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.timetable.delete({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: 'Timetable deleted successfully'
    });
  } catch (error) {
    logger.error('Delete timetable error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete timetable'
    });
  }
};
