const { body, validationResult } = require('express-validator');
const xss = require('xss');

/**
 * Global sanitization middleware to protect against XSS attacks
 * Sanitizes all string inputs and removes potentially malicious code
 */
exports.sanitizeInputs = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    // Use xss library to clean the string (requires: npm install xss)
    return xss(obj, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoredTag: true,
      stripLeadingAndTrailingWhitespace: true
    });
  }

  return obj;
}

/**
 * Validation middleware - checks for validation errors
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next();
};

/**
 * Chain sanitization rules for specific fields
 * Usage: sanitizeField('email').isEmail().normalizeEmail()
 */
exports.sanitizeField = (fieldName) => {
  return body(fieldName)
    .trim()
    .escape()
    .customSanitizer(value => {
      if (typeof value === 'string') {
        return xss(value, { whiteList: {}, stripIgnoredTag: true });
      }
      return value;
    });
};

/**
 * Whitelist and sanitize specific field types
 */
exports.sanitizeEmail = (fieldName) => {
  return body(fieldName)
    .trim()
    .toLowerCase()
    .isEmail()
    .normalizeEmail();
};

exports.sanitizeString = (fieldName, options = {}) => {
  const { minLength = 1, maxLength = 5000 } = options;
  return body(fieldName)
    .trim()
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`Must be between ${minLength} and ${maxLength} characters`)
    .escape()
    .customSanitizer(value => {
      return xss(value, { whiteList: {}, stripIgnoredTag: true });
    });
};

exports.sanitizeNumber = (fieldName) => {
  return body(fieldName)
    .isNumeric()
    .withMessage('Must be a valid number')
    .toInt();
};

exports.sanitizeDate = (fieldName) => {
  return body(fieldName)
    .trim()
    .isISO8601()
    .withMessage('Must be a valid date')
    .toDate();
};

/**
 * Escape HTML special characters
 */
exports.escapeHtml = (str) => {
  if (typeof str !== 'string') return str;

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return str.replace(/[&<>"']/g, char => map[char]);
};

/**
 * Remove potentially dangerous characters
 */
exports.removeDangerousCharacters = (str) => {
  if (typeof str !== 'string') return str;
  // Remove script tags, event handlers, and other dangerous patterns
  return str.replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '');
};
