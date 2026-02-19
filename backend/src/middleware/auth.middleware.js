const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Authenticate user
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No authentication token, access denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};

// Backward-compatible alias used by several route modules
exports.validateToken = exports.authenticate;

// Authorize by role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

const getInheritedRoles = async (role) => {
  const visited = new Set([role]);
  const queue = [role];

  while (queue.length > 0) {
    const current = queue.shift();
    const children = await prisma.roleHierarchy.findMany({
      where: { parentRole: current },
      select: { childRole: true }
    });

    children.forEach(({ childRole }) => {
      if (!visited.has(childRole)) {
        visited.add(childRole);
        queue.push(childRole);
      }
    });
  }

  return Array.from(visited);
};

const checkPermission = async (userId, role, permissionKey) => {
  const permission = await prisma.permission.findUnique({
    where: { key: permissionKey },
    select: { id: true }
  });

  if (!permission) {
    return false;
  }

  const userPermission = await prisma.userPermission.findUnique({
    where: {
      userId_permissionId: {
        userId,
        permissionId: permission.id
      }
    },
    select: { allowed: true }
  });

  if (userPermission) {
    return userPermission.allowed;
  }

  const rolesToCheck = await getInheritedRoles(role);
  const rolePermission = await prisma.rolePermission.findFirst({
    where: {
      permissionId: permission.id,
      role: { in: rolesToCheck },
      allowed: true
    },
    select: { id: true }
  });

  return !!rolePermission;
};

exports.authorizePermission = (permissionKey, fallbackRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Not authenticated'
        });
      }

      const hasPermission = await checkPermission(req.user.id, req.user.role, permissionKey);

      if (hasPermission || fallbackRoles.includes(req.user.role)) {
        return next();
      }

      return res.status(403).json({
        status: 'error',
        message: `Access denied. Missing permission: ${permissionKey}`
      });
    } catch (error) {
      logger.error('Permission authorization error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Permission authorization failed'
      });
    }
  };
};
