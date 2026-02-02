const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

exports.getAllStaff = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: {
              email: true,
              role: true,
              isActive: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.staff.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        staff,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get staff error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch staff'
    });
  }
};

exports.getStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            isActive: true
          }
        },
        subjects: true,
        classesAsTeacher: true
      }
    });

    if (!staff) {
      return res.status(404).json({
        status: 'error',
        message: 'Staff not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { staff }
    });
  } catch (error) {
    logger.error('Get staff error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch staff'
    });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const data = req.body;

    const staff = await prisma.staff.create({
      data: {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
        joiningDate: new Date(data.joiningDate || new Date())
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Staff created successfully',
      data: { staff }
    });
  } catch (error) {
    logger.error('Create staff error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create staff'
    });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    if (data.joiningDate) data.joiningDate = new Date(data.joiningDate);

    const staff = await prisma.staff.update({
      where: { id },
      data
    });

    res.status(200).json({
      status: 'success',
      message: 'Staff updated successfully',
      data: { staff }
    });
  } catch (error) {
    logger.error('Update staff error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update staff'
    });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.staff.delete({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    logger.error('Delete staff error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete staff'
    });
  }
};

exports.getStaffLeaves = async (req, res) => {
  try {
    const { id } = req.params;

    const leaves = await prisma.leave.findMany({
      where: { staffId: id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { leaves }
    });
  } catch (error) {
    logger.error('Get leaves error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch leaves'
    });
  }
};

exports.applyLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;

    const leave = await prisma.leave.create({
      data: {
        staffId: id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Leave application submitted',
      data: { leave }
    });
  } catch (error) {
    logger.error('Apply leave error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to apply leave'
    });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, remarks } = req.body;

    const leave = await prisma.leave.update({
      where: { id: leaveId },
      data: {
        status,
        remarks,
        approvedBy: req.user.id
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Leave status updated',
      data: { leave }
    });
  } catch (error) {
    logger.error('Update leave status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update leave status'
    });
  }
};
