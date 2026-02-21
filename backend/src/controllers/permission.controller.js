const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const defaultPermissions = [
  { key: 'students.view', name: 'View Students', module: 'students', isSystem: true },
  { key: 'students.create', name: 'Create Students', module: 'students', isSystem: true },
  { key: 'students.update', name: 'Update Students', module: 'students', isSystem: true },
  { key: 'students.delete', name: 'Delete Students', module: 'students', isSystem: true },
  { key: 'students.promote', name: 'Promote Students', module: 'students', isSystem: true },
  { key: 'students.detain', name: 'Detain Students', module: 'students', isSystem: true },
  { key: 'students.transfer', name: 'Transfer Students', module: 'students', isSystem: true },
  { key: 'staff.manage', name: 'Manage Staff', module: 'staff', isSystem: true },
  { key: 'fees.manage', name: 'Manage Fees', module: 'fees', isSystem: true },
  { key: 'attendance.manage', name: 'Manage Attendance', module: 'attendance', isSystem: true },
  { key: 'exams.manage', name: 'Manage Exams', module: 'exams', isSystem: true },
  { key: 'notifications.manage', name: 'Manage Notifications', module: 'notifications', isSystem: true },
  { key: 'permissions.manage', name: 'Manage Permissions', module: 'permissions', isSystem: true }
];

exports.initializeDefaultPermissions = async (req, res) => {
  try {
    const created = [];

    for (const permission of defaultPermissions) {
      const record = await prisma.permission.upsert({
        where: { key: permission.key },
        update: {
          name: permission.name,
          module: permission.module,
          isSystem: permission.isSystem
        },
        create: permission
      });
      created.push(record);
    }

    res.status(200).json({
      status: 'success',
      message: 'Default permissions initialized',
      data: { permissions: created }
    });
  } catch (error) {
    logger.error('Initialize permissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize permissions'
    });
  }
};

exports.createPermission = async (req, res) => {
  try {
    const { key, name, module, description } = req.body;

    const permission = await prisma.permission.create({
      data: {
        key,
        name,
        module,
        description,
        isSystem: false
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Permission created successfully',
      data: { permission }
    });
  } catch (error) {
    logger.error('Create permission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create permission'
    });
  }
};

exports.getPermissions = async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      include: {
        rolePermissions: true,
        userPermissions: true
      },
      orderBy: [{ module: 'asc' }, { key: 'asc' }]
    });

    res.status(200).json({
      status: 'success',
      data: { permissions }
    });
  } catch (error) {
    logger.error('Get permissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch permissions'
    });
  }
};

exports.setRolePermissions = async (req, res) => {
  try {
    const { role, permissions } = req.body;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'permissions array is required'
      });
    }

    const updated = [];

    for (const item of permissions) {
      const permission = await prisma.permission.findUnique({ where: { key: item.key } });
      if (!permission) continue;

      const rolePermission = await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role,
            permissionId: permission.id
          }
        },
        update: {
          allowed: item.allowed !== false
        },
        create: {
          role,
          permissionId: permission.id,
          allowed: item.allowed !== false
        }
      });

      updated.push(rolePermission);
    }

    res.status(200).json({
      status: 'success',
      message: 'Role permissions updated',
      data: { role, rolePermissions: updated }
    });
  } catch (error) {
    logger.error('Set role permissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to set role permissions'
    });
  }
};

exports.setUserPermissions = async (req, res) => {
  try {
    const { userId, permissions } = req.body;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'permissions array is required'
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const updated = [];

    for (const item of permissions) {
      const permission = await prisma.permission.findUnique({ where: { key: item.key } });
      if (!permission) continue;

      const userPermission = await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id
          }
        },
        update: {
          allowed: item.allowed !== false
        },
        create: {
          userId,
          permissionId: permission.id,
          allowed: item.allowed !== false
        }
      });

      updated.push(userPermission);
    }

    res.status(200).json({
      status: 'success',
      message: 'User permissions updated',
      data: { userId, userPermissions: updated }
    });
  } catch (error) {
    logger.error('Set user permissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to set user permissions'
    });
  }
};

exports.getRoleHierarchy = async (req, res) => {
  try {
    const hierarchy = await prisma.roleHierarchy.findMany({
      orderBy: [{ parentRole: 'asc' }, { childRole: 'asc' }]
    });

    res.status(200).json({
      status: 'success',
      data: { hierarchy }
    });
  } catch (error) {
    logger.error('Get role hierarchy error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch role hierarchy'
    });
  }
};

exports.setRoleHierarchy = async (req, res) => {
  try {
    const { parentRole, childRole } = req.body;

    if (parentRole === childRole) {
      return res.status(400).json({
        status: 'error',
        message: 'parentRole and childRole cannot be the same'
      });
    }

    const relation = await prisma.roleHierarchy.upsert({
      where: {
        parentRole_childRole: {
          parentRole,
          childRole
        }
      },
      update: {},
      create: {
        parentRole,
        childRole
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Role hierarchy updated',
      data: { relation }
    });
  } catch (error) {
    logger.error('Set role hierarchy error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update role hierarchy'
    });
  }
};
