const path = require('path');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const fileManager = require('../utils/fileManager');
const activityService = require('../utils/activity');

const prisma = new PrismaClient();
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || 'uploads');

const resolveUploadPath = (filePath) => {
  const normalizedPath = path.normalize(filePath);

  if (path.isAbsolute(normalizedPath)) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith('uploads') || normalizedPath.startsWith(`${uploadRoot}${path.sep}`)) {
    return path.join(uploadRoot, normalizedPath.replace(/^uploads[\\/]/, ''));
  }

  return path.join(uploadRoot, normalizedPath);
};

const toRelativeUploadPath = (filePath) => {
  const fullPath = resolveUploadPath(filePath);
  return path.relative(uploadRoot, fullPath).split(path.sep).join('/');
};

const ensureTeacherOwnership = async (userId, teacherId) => {
  const staff = await prisma.staff.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!staff || staff.id !== teacherId) {
    return false;
  }

  return true;
};

const getStudentByUser = async (userId) => {
  return prisma.student.findUnique({
    where: { userId },
    select: { id: true, classId: true }
  });
};

exports.getAllLmsContent = async (req, res) => {
  try {
    const {
      classId,
      subjectId,
      teacherId,
      type,
      visibility,
      q,
      page = '1',
      limit = '20'
    } = req.query;

    const take = Math.min(Number.parseInt(limit, 10) || 20, 100);
    const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const skip = (currentPage - 1) * take;

    const where = {};

    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (teacherId) where.teacherId = teacherId;
    if (type) where.type = type;
    if (visibility) where.visibility = visibility;

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (['STUDENT', 'PARENT'].includes(req.user.role)) {
      where.visibility = 'PUBLISHED';
    }

    const [items, total] = await Promise.all([
      prisma.lmsContent.findMany({
        where,
        include: {
          class: true,
          subject: true,
          teacher: true,
          attachments: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.lmsContent.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        items,
        total,
        page: currentPage,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    logger.error('Get LMS content error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch LMS content'
    });
  }
};

exports.getLmsContentById = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await prisma.lmsContent.findUnique({
      where: { id },
      include: {
        class: true,
        subject: true,
        teacher: true,
        attachments: true
      }
    });

    if (!content) {
      return res.status(404).json({
        status: 'error',
        message: 'LMS content not found'
      });
    }

    if (['STUDENT', 'PARENT'].includes(req.user.role) && content.visibility !== 'PUBLISHED') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { content }
    });
  } catch (error) {
    logger.error('Get LMS content error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch LMS content'
    });
  }
};

exports.createLmsContent = async (req, res) => {
  try {
    const data = req.body;

    if (req.user.role === 'TEACHER') {
      const owns = await ensureTeacherOwnership(req.user.id, data.teacherId);
      if (!owns) {
        return res.status(403).json({
          status: 'error',
          message: 'Teachers can only create content for themselves'
        });
      }
    }

    const content = await prisma.lmsContent.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        visibility: data.visibility || 'DRAFT',
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        totalMarks: data.totalMarks ? Number.parseInt(data.totalMarks, 10) : null,
        instructions: data.instructions
      },
      include: {
        class: true,
        subject: true,
        teacher: true,
        attachments: true
      }
    });

    await activityService.logActivity(
      req.user.id,
      'OTHER',
      'CREATE',
      'lms',
      `Created LMS content: ${content.title}`,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        resourceId: content.id,
        resourceType: 'lms_content',
        status: 'SUCCESS'
      }
    );

    res.status(201).json({
      status: 'success',
      message: 'LMS content created successfully',
      data: { content }
    });
  } catch (error) {
    logger.error('Create LMS content error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create LMS content'
    });
  }
};

exports.updateLmsContent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const existing = await prisma.lmsContent.findUnique({
      where: { id },
      select: { teacherId: true }
    });

    if (!existing) {
      return res.status(404).json({
        status: 'error',
        message: 'LMS content not found'
      });
    }

    if (req.user.role === 'TEACHER') {
      const owns = await ensureTeacherOwnership(req.user.id, existing.teacherId);
      if (!owns) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }

      if (updates.teacherId && updates.teacherId !== existing.teacherId) {
        return res.status(403).json({
          status: 'error',
          message: 'Teachers cannot reassign content ownership'
        });
      }
    }

    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }

    if (updates.totalMarks !== undefined) {
      updates.totalMarks = updates.totalMarks ? Number.parseInt(updates.totalMarks, 10) : null;
    }

    const content = await prisma.lmsContent.update({
      where: { id },
      data: updates,
      include: {
        class: true,
        subject: true,
        teacher: true,
        attachments: true
      }
    });

    await activityService.logActivity(
      req.user.id,
      'OTHER',
      'UPDATE',
      'lms',
      `Updated LMS content: ${content.title}`,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        resourceId: content.id,
        resourceType: 'lms_content',
        changes: updates,
        status: 'SUCCESS'
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'LMS content updated successfully',
      data: { content }
    });
  } catch (error) {
    logger.error('Update LMS content error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update LMS content'
    });
  }
};

exports.deleteLmsContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await prisma.lmsContent.findUnique({
      where: { id },
      include: { attachments: true }
    });

    if (!content) {
      return res.status(404).json({
        status: 'error',
        message: 'LMS content not found'
      });
    }

    if (req.user.role === 'TEACHER') {
      const owns = await ensureTeacherOwnership(req.user.id, content.teacherId);
      if (!owns) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    await Promise.all(
      content.attachments.map((file) => fileManager.deleteFile(file.path))
    );

    await prisma.lmsContent.delete({
      where: { id }
    });

    await activityService.logActivity(
      req.user.id,
      'OTHER',
      'DELETE',
      'lms',
      `Deleted LMS content: ${content.title}`,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        resourceId: content.id,
        resourceType: 'lms_content',
        status: 'SUCCESS'
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'LMS content deleted successfully'
    });
  } catch (error) {
    logger.error('Delete LMS content error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete LMS content'
    });
  }
};

exports.uploadLmsAttachments = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await prisma.lmsContent.findUnique({
      where: { id },
      select: { id: true, title: true, teacherId: true }
    });

    if (!content) {
      return res.status(404).json({
        status: 'error',
        message: 'LMS content not found'
      });
    }

    if (req.user.role === 'TEACHER') {
      const owns = await ensureTeacherOwnership(req.user.id, content.teacherId);
      if (!owns) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files provided'
      });
    }

    await prisma.lmsContentFile.createMany({
      data: req.files.map((file) => ({
        contentId: content.id,
        originalName: file.originalname,
        filename: file.filename,
        path: toRelativeUploadPath(file.path),
        size: file.size,
        mimetype: file.mimetype,
        category: fileManager.getFileCategory(file.originalname),
        uploadedBy: req.user.id
      }))
    });

    await activityService.logActivity(
      req.user.id,
      'OTHER',
      'UPLOAD',
      'lms',
      `Uploaded ${req.files.length} attachment(s) to LMS content: ${content.title}`,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        resourceId: content.id,
        resourceType: 'lms_content',
        status: 'SUCCESS'
      }
    );

    const updatedContent = await prisma.lmsContent.findUnique({
      where: { id },
      include: { attachments: true }
    });

    res.status(201).json({
      status: 'success',
      message: 'Attachments uploaded successfully',
      data: {
        attachments: updatedContent.attachments,
        content: updatedContent
      }
    });
  } catch (error) {
    logger.error('Upload LMS attachments error:', error);

    if (req.files) {
      await Promise.all(req.files.map((file) => fileManager.deleteFile(file.path)));
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to upload attachments'
    });
  }
};

exports.deleteLmsAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    const attachment = await prisma.lmsContentFile.findUnique({
      where: { id: attachmentId },
      include: { content: { select: { teacherId: true } } }
    });

    if (!attachment || attachment.contentId !== id) {
      return res.status(404).json({
        status: 'error',
        message: 'Attachment not found'
      });
    }

    if (req.user.role === 'TEACHER') {
      const owns = await ensureTeacherOwnership(req.user.id, attachment.content.teacherId);
      if (!owns) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    await fileManager.deleteFile(attachment.path);

    await prisma.lmsContentFile.delete({
      where: { id: attachmentId }
    });

    await activityService.logActivity(
      req.user.id,
      'OTHER',
      'DELETE',
      'lms',
      `Deleted LMS attachment: ${attachment.originalName}`,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        resourceId: attachment.id,
        resourceType: 'lms_attachment',
        status: 'SUCCESS'
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    logger.error('Delete LMS attachment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete attachment'
    });
  }
};

exports.getLmsSubmissions = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await prisma.lmsContent.findUnique({
      where: { id },
      include: { submissions: { include: { student: true, attachments: true } } }
    });

    if (!content) {
      return res.status(404).json({
        status: 'error',
        message: 'LMS content not found'
      });
    }

    if (req.user.role === 'TEACHER') {
      const owns = await ensureTeacherOwnership(req.user.id, content.teacherId);
      if (!owns) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: { submissions: content.submissions }
    });
  } catch (error) {
    logger.error('Get LMS submissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch submissions'
    });
  }
};

exports.getMySubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await getStudentByUser(req.user.id);

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    const submission = await prisma.lmsSubmission.findUnique({
      where: {
        contentId_studentId: {
          contentId: id,
          studentId: student.id
        }
      },
      include: { attachments: true }
    });

    res.status(200).json({
      status: 'success',
      data: { submission }
    });
  } catch (error) {
    logger.error('Get LMS submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch submission'
    });
  }
};

exports.createSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Submission files are required'
      });
    }

    const student = await getStudentByUser(req.user.id);

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    const content = await prisma.lmsContent.findUnique({
      where: { id },
      select: { id: true, type: true, dueDate: true }
    });

    if (!content) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    if (content.type !== 'ASSIGNMENT') {
      return res.status(400).json({
        status: 'error',
        message: 'Submissions are only allowed for assignments'
      });
    }

    const existing = await prisma.lmsSubmission.findUnique({
      where: {
        contentId_studentId: {
          contentId: id,
          studentId: student.id
        }
      }
    });

    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'Submission already exists'
      });
    }

    const isLate = content.dueDate ? new Date() > content.dueDate : false;

    const submission = await prisma.lmsSubmission.create({
      data: {
        contentId: id,
        studentId: student.id,
        status: isLate ? 'LATE' : 'SUBMITTED'
      }
    });

    await prisma.lmsSubmissionFile.createMany({
      data: req.files.map((file) => ({
        submissionId: submission.id,
        originalName: file.originalname,
        filename: file.filename,
        path: toRelativeUploadPath(file.path),
        size: file.size,
        mimetype: file.mimetype,
        category: fileManager.getFileCategory(file.originalname),
        uploadedBy: req.user.id
      }))
    });

    const updated = await prisma.lmsSubmission.findUnique({
      where: { id: submission.id },
      include: { attachments: true }
    });

    res.status(201).json({
      status: 'success',
      message: 'Submission created successfully',
      data: { submission: updated }
    });
  } catch (error) {
    logger.error('Create LMS submission error:', error);

    if (req.files) {
      await Promise.all(req.files.map((file) => fileManager.deleteFile(file.path)));
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to create submission'
    });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { id, submissionId } = req.params;
    const { grade, feedback } = req.body;

    const submission = await prisma.lmsSubmission.findUnique({
      where: { id: submissionId },
      include: { content: true }
    });

    if (!submission || submission.contentId !== id) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found'
      });
    }

    if (req.user.role === 'TEACHER') {
      const owns = await ensureTeacherOwnership(req.user.id, submission.content.teacherId);
      if (!owns) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    const updated = await prisma.lmsSubmission.update({
      where: { id: submissionId },
      data: {
        grade: grade !== undefined && grade !== null ? Number.parseFloat(grade) : null,
        feedback: feedback || null,
        status: 'GRADED',
        gradedBy: req.user.id,
        gradedAt: new Date()
      },
      include: { attachments: true }
    });

    res.status(200).json({
      status: 'success',
      message: 'Submission graded successfully',
      data: { submission: updated }
    });
  } catch (error) {
    logger.error('Grade LMS submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to grade submission'
    });
  }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const student = await getStudentByUser(req.user.id);

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student profile not found'
      });
    }

    const submissions = await prisma.lmsSubmission.findMany({
      where: { studentId: student.id },
      include: {
        content: true,
        attachments: true
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { submissions }
    });
  } catch (error) {
    logger.error('Get my LMS submissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch submissions'
    });
  }
};

exports.getLmsAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await prisma.lmsContent.findUnique({
      where: { id },
      select: { id: true, teacherId: true, type: true }
    });

    if (!content) {
      return res.status(404).json({
        status: 'error',
        message: 'LMS content not found'
      });
    }

    if (req.user.role === 'TEACHER') {
      const owns = await ensureTeacherOwnership(req.user.id, content.teacherId);
      if (!owns) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied'
        });
      }
    }

    const [total, graded, late, avgGrade] = await Promise.all([
      prisma.lmsSubmission.count({ where: { contentId: id } }),
      prisma.lmsSubmission.count({ where: { contentId: id, status: 'GRADED' } }),
      prisma.lmsSubmission.count({ where: { contentId: id, status: 'LATE' } }),
      prisma.lmsSubmission.aggregate({
        where: { contentId: id, grade: { not: null } },
        _avg: { grade: true }
      })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        analytics: {
          totalSubmissions: total,
          gradedSubmissions: graded,
          lateSubmissions: late,
          averageGrade: avgGrade._avg.grade || 0
        }
      }
    });
  } catch (error) {
    logger.error('Get LMS analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics'
    });
  }
};
