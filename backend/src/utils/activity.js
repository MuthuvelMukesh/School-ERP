const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient();

/**
 * Activity Logging Service
 * Captures and stores user actions for audit trails and analytics
 */

/**
 * Log an activity
 * @param {string} userId - ID of user performing the action
 * @param {string} action - The action performed (ActivityAction enum)
 * @param {string} actionType - Type of action (ActivityType enum)
 * @param {string} module - Module/feature being accessed
 * @param {string} description - Human-readable description of the action
 * @param {Object} options - Additional options
 */
exports.logActivity = async (userId, action, actionType, module, description, options = {}) => {
  try {
    const {
      ipAddress = null,
      userAgent = null,
      resourceId = null,
      resourceType = null,
      changes = null,
      status = 'SUCCESS'
    } = options;

    const activity = await prisma.activity.create({
      data: {
        userId,
        action,
        actionType,
        module,
        description,
        ipAddress,
        userAgent,
        resourceId,
        resourceType,
        changes: changes ? JSON.stringify(changes) : null,
        status
      }
    });

    logger.info(`Activity logged: ${action} by user ${userId}`);
    return activity;
  } catch (error) {
    logger.error('Error logging activity:', error);
    // Don't throw error to avoid interrupting main flow
    return null;
  }
};

/**
 * Middleware to automatically log activities
 * Attach request metadata for logging
 */
exports.activityLogger = (req, res, next) => {
  // Store request metadata for use in route handlers
  req.activityMeta = {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || null
  };

  // Override res.json to capture response status
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    res.statusCode = res.statusCode || 200;
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Get activity logs with filters
 * @param {Object} filters - Filter criteria
 * @param {number} skip - Pagination skip
 * @param {number} take - Pagination limit
 */
exports.getActivities = async (filters = {}, skip = 0, take = 20) => {
  try {
    const {
      userId = null,
      action = null,
      module = null,
      startDate = null,
      endDate = null,
      status = null
    } = filters;

    const where = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (module) where.module = module;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.activity.count({ where })
    ]);

    return {
      data: activities,
      total,
      pages: Math.ceil(total / take),
      currentPage: Math.floor(skip / take) + 1
    };
  } catch (error) {
    logger.error('Error fetching activities:', error);
    throw error;
  }
};

/**
 * Get user activity summary (for dashboard)
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back
 */
exports.getUserActivitySummary = async (userId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await prisma.activity.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group activities by type
    const summary = {
      totalActivities: activities.length,
      byAction: {},
      byModule: {},
      byDate: {},
      lastActivity: activities[0] || null,
      recentActivities: activities.slice(0, 10)
    };

    activities.forEach(activity => {
      // Count by action
      summary.byAction[activity.action] = (summary.byAction[activity.action] || 0) + 1;

      // Count by module
      summary.byModule[activity.module] = (summary.byModule[activity.module] || 0) + 1;

      // Count by date
      const dateKey = activity.createdAt.toISOString().split('T')[0];
      summary.byDate[dateKey] = (summary.byDate[dateKey] || 0) + 1;
    });

    return summary;
  } catch (error) {
    logger.error('Error getting user activity summary:', error);
    throw error;
  }
};

/**
 * Get module activity statistics
 * @param {string} module - Module name
 * @param {number} days - Number of days to look back
 */
exports.getModuleStats = async (module, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await prisma.activity.findMany({
      where: {
        module,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    });

    const stats = {
      module,
      totalActivities: activities.length,
      byAction: {},
      byStatus: {},
      byDate: {},
      topUsers: {}
    };

    activities.forEach(activity => {
      stats.byAction[activity.action] = (stats.byAction[activity.action] || 0) + 1;
      stats.byStatus[activity.status] = (stats.byStatus[activity.status] || 0) + 1;

      const dateKey = activity.createdAt.toISOString().split('T')[0];
      stats.byDate[dateKey] = (stats.byDate[dateKey] || 0) + 1;

      stats.topUsers[activity.userId] = (stats.topUsers[activity.userId] || 0) + 1;
    });

    // Sort users by activity count
    stats.topUsers = Object.entries(stats.topUsers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((acc, [userId, count]) => {
        acc[userId] = count;
        return acc;
      }, {});

    return stats;
  } catch (error) {
    logger.error('Error getting module stats:', error);
    throw error;
  }
};

/**
 * Clear old activities (for data cleanup)
 * @param {number} daysToKeep - Keep activities from the last N days
 */
exports.cleanupOldActivities = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.activity.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });

    logger.info(`Deleted ${result.count} old activity logs`);
    return result;
  } catch (error) {
    logger.error('Error cleaning up old activities:', error);
    throw error;
  }
};

/**
 * Export activities to CSV (for auditing)
 * @param {Object} filters - Filter criteria
 */
exports.exportActivitiesAsCSV = async (filters = {}) => {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.module && { module: filters.module }),
        ...(filters.startDate && {
          createdAt: { gte: new Date(filters.startDate) }
        })
      },
      orderBy: { createdAt: 'desc' }
    });

    // Convert to CSV format
    const headers = [
      'Date',
      'Time',
      'User ID',
      'Action',
      'Module',
      'Description',
      'Resource Type',
      'Resource ID',
      'Status',
      'IP Address'
    ];

    const rows = activities.map(activity => [
      activity.createdAt.toISOString().split('T')[0],
      activity.createdAt.toISOString().split('T')[1],
      activity.userId,
      activity.action,
      activity.module,
      activity.description,
      activity.resourceType || 'N/A',
      activity.resourceId || 'N/A',
      activity.status,
      activity.ipAddress || 'N/A'
    ]);

    return {
      headers,
      rows,
      total: activities.length
    };
  } catch (error) {
    logger.error('Error exporting activities:', error);
    throw error;
  }
};

module.exports = exports;
