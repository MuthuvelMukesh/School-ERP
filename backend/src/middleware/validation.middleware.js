const { validationResult, body } = require('express-validator');
const xss = require('xss');

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
 * Sanitize email field
 */
exports.sanitizeEmail = (fieldName) => {
  return body(fieldName)
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail();
};

/**
 * Sanitize string field
 */
exports.sanitizeString = (fieldName, options = {}) => {
  const { minLength = 1, maxLength = 500 } = options;
  return body(fieldName)
    .trim()
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`Must be between ${minLength} and ${maxLength} characters`)
    .escape()
    .customSanitizer(value => {
      if (typeof value === 'string') {
        return xss(value, { whiteList: {}, stripIgnoredTag: true });
      }
      return value;
    });
};

/**
 * Sanitize number field
 */
exports.sanitizeNumber = (fieldName) => {
  return body(fieldName)
    .isNumeric()
    .withMessage('Must be a valid number')
    .toInt();
};

/**
 * Sanitize date field
 */
exports.sanitizeDate = (fieldName) => {
  return body(fieldName)
    .trim()
    .isISO8601()
    .withMessage('Must be a valid date')
    .toDate();
};
