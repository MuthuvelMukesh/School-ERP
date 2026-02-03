const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const activityService = require('../utils/activity');

const prisma = new PrismaClient();

/**
 * Get recent activities (dashboard view)
 */
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 20, userId, module } = req.query;

    const activities = await prisma.activity.findMany({
      where: {
        ...(userId && { userId }),
        ...(module && { module })
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        userId: true,
        action: true,
        module: true,
        description: true,
        resourceType: true,
        status: true,
        createdAt: true
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Recent activities retrieved',
      data: {
        activities,
        count: activities.length
      }
    });
  } catch (error) {
    logger.error('Error fetching recent activities:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activities'
    });
  }
};

/**
 * Get all activities with filters and pagination
 */
exports.getAllActivities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      module,
      startDate,
      endDate,
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filters = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(module && { module }),
      ...(status && { status }),
      ...(startDate || endDate) && {
        startDate: startDate || null,
        endDate: endDate || null
      }
    };

    const result = await activityService.getActivities(filters, skip, parseInt(limit));

    res.status(200).json({
      status: 'success',
      message: 'Activities retrieved',
      data: result
    });
  } catch (error) {
    logger.error('Error fetching all activities:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activities'
    });
  }
};

/**
 * Get user activity summary
 */
exports.getUserActivitySummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const summary = await activityService.getUserActivitySummary(userId, parseInt(days));

    res.status(200).json({
      status: 'success',
      message: 'User activity summary retrieved',
      data: summary
    });
  } catch (error) {
    logger.error('Error fetching user activity summary:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activity summary'
    });
  }
};

/**
 * Get module statistics
 */
exports.getModuleStats = async (req, res) => {
  try {
    const { module } = req.params;
    const { days = 30 } = req.query;

    const stats = await activityService.getModuleStats(module, parseInt(days));

    res.status(200).json({
      status: 'success',
      message: 'Module statistics retrieved',
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching module stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch module statistics'
    });
  }
};

/**
 * Export activities as CSV
 */
exports.exportActivities = async (req, res) => {
  try {
    const { userId, module, startDate } = req.query;

    const csvData = await activityService.exportActivitiesAsCSV({
      userId,
      module,
      startDate
    });

    // Convert to CSV string
    const csv = [
      csvData.headers.join(','),
      ...csvData.rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="activities_${new Date().getTime()}.csv"`);
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting activities:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export activities'
    });
  }
};

/**
 * Get activity by ID
 */
exports.getActivityById = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return res.status(404).json({
        status: 'error',
        message: 'Activity not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { activity }
    });
  } catch (error) {
    logger.error('Error fetching activity:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activity'
    });
  }
};

/**
 * Delete old activities (admin only)
 */
exports.cleanupOldActivities = async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;

    // Verify admin role
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can perform this action'
      });
    }

    const result = await activityService.cleanupOldActivities(parseInt(daysToKeep));

    res.status(200).json({
      status: 'success',
      message: `Deleted ${result.count} old activity logs`,
      data: result
    });
  } catch (error) {
    logger.error('Error cleaning up activities:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cleanup activities'
    });
  }
};
