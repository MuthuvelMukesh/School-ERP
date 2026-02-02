const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for different log levels
const getLogFormat = () => {
  return winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    winston.format.json()
  );
};

// Console format for development
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, metadata }) => {
    let meta = '';
    if (metadata && Object.keys(metadata).length > 0) {
      meta = ` ${JSON.stringify(metadata)}`;
    }
    return `${timestamp} [${level}]: ${stack || message}${meta}`;
  })
);

// Production format
const prodFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, metadata }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      stack: stack || null,
      metadata: metadata || {}
    });
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: getLogFormat(),
  defaultMeta: {
    service: 'school-erp',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat
    }),

    // Error logs - only errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: prodFormat
    }),

    // All logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 10,
      format: prodFormat
    }),

    // Info logs only
    new winston.transports.File({
      filename: path.join(logsDir, 'info.log'),
      level: 'info',
      maxsize: 5242880,
      maxFiles: 5,
      format: prodFormat
    }),

    // Warn logs only
    new winston.transports.File({
      filename: path.join(logsDir, 'warn.log'),
      level: 'warn',
      maxsize: 5242880,
      maxFiles: 5,
      format: prodFormat
    })
  ],

  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ],

  // Handle rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

/**
 * Enhanced logging methods
 */
logger.logRequest = (req, res, message) => {
  logger.info(message, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    statusCode: res.statusCode,
    responseTime: Date.now() - req.startTime
  });
};

logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context
  });
};

logger.logSecurity = (event, details) => {
  logger.warn(`SECURITY: ${event}`, details);
};

logger.logPerformance = (operation, duration, threshold = 1000) => {
  if (duration > threshold) {
    logger.warn(`SLOW_OPERATION: ${operation} took ${duration}ms`, { duration, threshold });
  } else {
    logger.debug(`${operation} completed in ${duration}ms`);
  }
};

/**
 * Alert critical errors (for production)
 */
logger.alertCritical = async (message, error, context = {}) => {
  logger.error(`CRITICAL ALERT: ${message}`, {
    error: error?.message,
    stack: error?.stack,
    context
  });

  // Here you can integrate with external alerting services
  // Examples: Sentry, PagerDuty, Slack, email, etc.
  if (process.env.ENABLE_CRITICAL_ALERTS === 'true') {
    // Placeholder for alert integration
    try {
      // await sendAlert({ message, error, context });
    } catch (alertError) {
      logger.error('Failed to send critical alert', { alertError });
    }
  }
};

module.exports = logger;
