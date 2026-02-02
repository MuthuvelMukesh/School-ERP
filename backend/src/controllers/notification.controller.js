const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { sentAt: 'desc' }
      }),
      prisma.notification.count()
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
  }
};

exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { notification }
    });
  } catch (error) {
    logger.error('Get notification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notification'
    });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const { title, message, type, recipients } = req.body;

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        recipients,
        sentBy: req.user.id
      }
    });

    // Send emails if type is EMAIL
    if (type === 'EMAIL') {
      // Get recipient emails
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: recipients
          }
        },
        select: {
          email: true
        }
      });

      const emails = users.map(u => u.email);

      // Send email
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: emails.join(','),
        subject: title,
        text: message,
        html: `<p>${message}</p>`
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Notification sent successfully',
      data: { notification }
    });
  } catch (error) {
    logger.error('Send notification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send notification'
    });
  }
};
