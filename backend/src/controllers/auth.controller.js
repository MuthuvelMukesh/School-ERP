const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register user
exports.register = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, phone, ...otherData } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role
        }
      });

      // Create role-specific profile
      let profile;
      if (role === 'STUDENT') {
        profile = await tx.student.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
            phone: phone || '',
            address: otherData.address || '',
            admissionNo: otherData.admissionNo,
            dateOfBirth: new Date(otherData.dateOfBirth),
            gender: otherData.gender,
            classId: otherData.classId
          }
        });
      } else if (role === 'TEACHER' || role === 'PRINCIPAL' || role === 'ACCOUNTANT') {
        profile = await tx.staff.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
            phone: phone || '',
            address: otherData.address || '',
            employeeId: otherData.employeeId,
            dateOfBirth: new Date(otherData.dateOfBirth),
            gender: otherData.gender,
            designation: otherData.designation,
            joiningDate: new Date(otherData.joiningDate || new Date()),
            salary: parseFloat(otherData.salary || 0)
          }
        });
      } else if (role === 'PARENT') {
        profile = await tx.parent.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
            phone: phone || '',
            address: otherData.address || ''
          }
        });
      }

      return { user, profile };
    });

    // Generate token
    const token = generateToken(result.user.id);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role
        },
        token
      }
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        staff: true,
        parent: true
      }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate token
    const token = generateToken(user.id);

    // Get profile based on role
    let profile = null;
    if (user.role === 'STUDENT') {
      profile = user.student;
    } else if (['TEACHER', 'PRINCIPAL', 'ACCOUNTANT'].includes(user.role)) {
      profile = user.staff;
    } else if (user.role === 'PARENT') {
      profile = user.parent;
    }

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile
        },
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        student: true,
        staff: true,
        parent: true
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        student: true,
        staff: true,
        parent: true
      }
    });

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user data'
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  // Client-side should remove the token
  res.status(200).json({
    status: 'success',
    message: 'Logout successful'
  });
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password'
    });
  }
};
