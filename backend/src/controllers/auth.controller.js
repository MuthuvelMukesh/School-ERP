const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

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

// Forgot password - Generate reset token and send email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Security: Don't reveal if user exists or not
      return res.status(200).json({
        status: 'success',
        message: 'If a user with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: resetExpires
      }
    });

    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;

    try {
      await transporter.sendMail({
        to: email,
        subject: 'Password Reset Request - School ERP',
        html: `
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Click the link below to proceed:</p>
          <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
          <p>Or copy this link: ${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        `
      });

      logger.info(`Password reset email sent to ${email}`);
    } catch (emailError) {
      logger.error('Email sending error:', emailError);
      // Clear the reset token if email fails
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null
        }
      });

      return res.status(500).json({
        status: 'error',
        message: 'Failed to send reset email. Please try again later.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'If a user with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process password reset request'
    });
  }
};

// Reset password - Verify token and set new password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date() // Token must not be expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    logger.info(`Password reset successful for user ${user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password'
    });
  }
};

// Verify reset token - Check if token is valid
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date() // Token must not be expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Token is valid',
      data: {
        email: user.email
      }
    });
  } catch (error) {
    logger.error('Verify reset token error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify reset token'
    });
  }
};
