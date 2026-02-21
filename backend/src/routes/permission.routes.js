const express = require('express');
const { body } = require('express-validator');
const permissionController = require('../controllers/permission.controller');
const { authenticate, authorize, authorizePermission } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePermission('permissions.manage', ['ADMIN', 'PRINCIPAL']), permissionController.getPermissions);
router.post('/initialize', authorize('ADMIN'), permissionController.initializeDefaultPermissions);

router.post(
  '/',
  authorizePermission('permissions.manage', ['ADMIN']),
  [
    body('key').trim().notEmpty().withMessage('key is required'),
    body('name').trim().notEmpty().withMessage('name is required'),
    body('module').trim().notEmpty().withMessage('module is required'),
    body('description').optional().trim()
  ],
  validate,
  permissionController.createPermission
);

router.put(
  '/roles',
  authorizePermission('permissions.manage', ['ADMIN']),
  [
    body('role').isIn(['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN', 'TRANSPORT_STAFF'])
      .withMessage('Invalid role'),
    body('permissions').isArray({ min: 1 }).withMessage('permissions must be a non-empty array'),
    body('permissions.*.key').trim().notEmpty().withMessage('permission key is required'),
    body('permissions.*.allowed').optional().isBoolean().withMessage('allowed must be boolean')
  ],
  validate,
  permissionController.setRolePermissions
);

router.put(
  '/users',
  authorizePermission('permissions.manage', ['ADMIN']),
  [
    body('userId').trim().notEmpty().withMessage('userId is required'),
    body('permissions').isArray({ min: 1 }).withMessage('permissions must be a non-empty array'),
    body('permissions.*.key').trim().notEmpty().withMessage('permission key is required'),
    body('permissions.*.allowed').optional().isBoolean().withMessage('allowed must be boolean')
  ],
  validate,
  permissionController.setUserPermissions
);

router.get('/hierarchy', authorizePermission('permissions.manage', ['ADMIN', 'PRINCIPAL']), permissionController.getRoleHierarchy);

router.put(
  '/hierarchy',
  authorizePermission('permissions.manage', ['ADMIN']),
  [
    body('parentRole').isIn(['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN', 'TRANSPORT_STAFF'])
      .withMessage('Invalid parentRole'),
    body('childRole').isIn(['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN', 'TRANSPORT_STAFF'])
      .withMessage('Invalid childRole')
  ],
  validate,
  permissionController.setRoleHierarchy
);

module.exports = router;
