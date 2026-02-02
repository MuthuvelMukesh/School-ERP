const logger = require('../utils/logger');

/**
 * Custom Error Class
 */
class AppError extends Error {
  constructor(message, statusCode, context = {}) {
    super(message);
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Request timing middleware
 */
const requestTiming = (req, res, next) => {
  req.startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    logger.logRequest(req, res, `${req.method} ${req.path}`);
    logger.logPerformance(`${req.method} ${req.path}`, duration, 2000);
  });

  next();
};

/**
 * Global error handler middleware
 * Should be the last middleware in the app
 */
const errorHandler = (err, req, res, next) => {
  // Set default error properties
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log the error
  const errorContext = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id,
    query: req.query,
    body: sanitizeBody(req.body)
  };

  if (err.statusCode >= 500) {
    logger.alertCritical(`${err.statusCode} ${err.message}`, err, errorContext);
  } else {
    logger.logError(err, errorContext);
  }

  // Operational errors
  if (err instanceof AppError || err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'error',
      code: err.code || 'ERROR',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Prisma errors
  if (err.code?.startsWith('P')) {
    return handlePrismaError(err, res);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired'
    });
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    return handleMulterError(err, res);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: err.details || []
    });
  }

  // Generic server error
  logger.logError(err, errorContext);

  res.status(err.statusCode).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Handle Prisma errors
 */
const handlePrismaError = (err, res) => {
  const errorMap = {
    P2000: { statusCode: 400, message: 'The provided value for the column is too long' },
    P2002: { statusCode: 400, message: 'Unique constraint failed' },
    P2025: { statusCode: 404, message: 'Record not found' },
    P2003: { statusCode: 400, message: 'Foreign key constraint failed' },
    P2014: { statusCode: 400, message: 'Required relation violation' },
    P2023: { statusCode: 400, message: 'Inconsistent column data' }
  };

  const error = errorMap[err.code] || {
    statusCode: 400,
    message: 'Database operation failed'
  };

  return res.status(error.statusCode).json({
    status: 'error',
    code: `DB_${err.code}`,
    message: error.message
  });
};

/**
 * Handle Multer file upload errors
 */
const handleMulterError = (err, res) => {
  const errorMap = {
    LIMIT_FILE_SIZE: { statusCode: 413, message: 'File size exceeds limit' },
    LIMIT_FILE_COUNT: { statusCode: 400, message: 'Too many files uploaded' },
    LIMIT_UNEXPECTED_FILE: { statusCode: 400, message: 'Unexpected file field' },
    FILE_TOO_LARGE: { statusCode: 413, message: 'File is too large' }
  };

  const error = errorMap[err.code] || {
    statusCode: 400,
    message: err.message
  };

  return res.status(error.statusCode).json({
    status: 'error',
    code: `UPLOAD_${err.code}`,
    message: error.message
  });
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Sanitize body for logging (remove sensitive data)
 */
const sanitizeBody = (body) => {
  if (!body) return {};

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  const sanitized = { ...body };

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });

  return sanitized;
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`);

  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Cannot ${req.method} ${req.path}`
  });
};

module.exports = {
  AppError,
  errorHandler,
  requestTiming,
  asyncHandler,
  notFoundHandler,
  handlePrismaError,
  handleMulterError,
  sanitizeBody
};
