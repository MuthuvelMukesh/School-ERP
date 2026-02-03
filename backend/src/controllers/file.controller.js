const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const fileManager = require('../utils/fileManager');
const activityService = require('../utils/activity');

const prisma = new PrismaClient();

/**
 * Upload student document
 */
exports.uploadStudentDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file provided'
      });
    }

    const { studentId, documentType } = req.body;

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      // Delete uploaded file if student doesn't exist
      await fileManager.deleteFile(req.file.path);
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    // Store file reference in student documents
    const fileData = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      category: fileManager.getFileCategory(req.file.originalname),
      type: documentType,
      uploadedAt: new Date(),
      uploadedBy: req.user.id
    };

    // Update student documents (JSON field)
    const currentDocuments = student.documents ? JSON.parse(student.documents) : [];
    currentDocuments.push(fileData);

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        documents: JSON.stringify(currentDocuments)
      }
    });

    // Log activity
    await activityService.logActivity(
      req.user.id,
      'DOCUMENT_UPLOAD',
      'UPLOAD',
      'students',
      `Uploaded document: ${req.file.originalname}`,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        resourceId: studentId,
        resourceType: 'student',
        status: 'SUCCESS'
      }
    );

    res.status(201).json({
      status: 'success',
      message: 'Document uploaded successfully',
      data: {
        file: fileData,
        student: updatedStudent
      }
    });
  } catch (error) {
    logger.error('Upload student document error:', error);
    
    // Delete uploaded file on error
    if (req.file) {
      await fileManager.deleteFile(req.file.path);
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to upload document'
    });
  }
};

/**
 * Upload staff document
 */
exports.uploadStaffDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file provided'
      });
    }

    const { staffId, documentType } = req.body;

    // Validate staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId }
    });

    if (!staff) {
      await fileManager.deleteFile(req.file.path);
      return res.status(404).json({
        status: 'error',
        message: 'Staff member not found'
      });
    }

    // Store file reference
    const fileData = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      category: fileManager.getFileCategory(req.file.originalname),
      type: documentType,
      uploadedAt: new Date(),
      uploadedBy: req.user.id
    };

    // Update staff documents
    const currentDocuments = staff.documents ? JSON.parse(staff.documents) : [];
    currentDocuments.push(fileData);

    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        documents: JSON.stringify(currentDocuments)
      }
    });

    // Log activity
    await activityService.logActivity(
      req.user.id,
      'DOCUMENT_UPLOAD',
      'UPLOAD',
      'staff',
      `Uploaded document: ${req.file.originalname}`,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        resourceId: staffId,
        resourceType: 'staff',
        status: 'SUCCESS'
      }
    );

    res.status(201).json({
      status: 'success',
      message: 'Document uploaded successfully',
      data: {
        file: fileData,
        staff: updatedStaff
      }
    });
  } catch (error) {
    logger.error('Upload staff document error:', error);
    
    if (req.file) {
      await fileManager.deleteFile(req.file.path);
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to upload document'
    });
  }
};

/**
 * Download file
 */
exports.downloadFile = async (req, res) => {
  try {
    const { filePath } = req.params;

    // Security: Prevent path traversal attacks
    if (filePath.includes('..')) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const file = fileManager.getFile(filePath);

    if (!file) {
      return res.status(404).json({
        status: 'error',
        message: 'File not found'
      });
    }

    // Log download activity
    await activityService.logActivity(
      req.user.id,
      'DOCUMENT_DOWNLOAD',
      'DOWNLOAD',
      'documents',
      `Downloaded: ${filePath}`,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS'
      }
    );

    res.download(file.path);
  } catch (error) {
    logger.error('Download file error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to download file'
    });
  }
};

/**
 * Delete file
 */
exports.deleteFile = async (req, res) => {
  try {
    const { filePath } = req.params;

    // Security: Prevent path traversal attacks
    if (filePath.includes('..')) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    const success = await fileManager.deleteFile(filePath);

    if (!success) {
      return res.status(404).json({
        status: 'error',
        message: 'File not found'
      });
    }

    // Log deletion activity
    await activityService.logActivity(
      req.user.id,
      'DOCUMENT_DELETE',
      'DELETE',
      'documents',
      `Deleted: ${filePath}`,
      {
        ipAddress: req.ip,
        status: 'SUCCESS'
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('Delete file error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete file'
    });
  }
};

/**
 * Get upload directory info
 */
exports.getUploadStats = async (req, res) => {
  try {
    // Admin only
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can access this resource'
      });
    }

    const stats = fileManager.getUploadDirSize();

    res.status(200).json({
      status: 'success',
      message: 'Upload statistics retrieved',
      data: stats
    });
  } catch (error) {
    logger.error('Get upload stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get upload statistics'
    });
  }
};

/**
 * Cleanup old files (admin only)
 */
exports.cleanupOldFiles = async (req, res) => {
  try {
    // Admin only
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can perform this action'
      });
    }

    const { daysOld = 30 } = req.body;

    const result = fileManager.cleanupOldFiles(daysOld);

    // Log cleanup activity
    await activityService.logActivity(
      req.user.id,
      'CLEANUP',
      'DELETE',
      'documents',
      `Cleaned up files older than ${daysOld} days`,
      {
        status: 'SUCCESS'
      }
    );

    res.status(200).json({
      status: 'success',
      message: `Deleted ${result.deletedCount} old files`,
      data: result
    });
  } catch (error) {
    logger.error('Cleanup old files error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cleanup files'
    });
  }
};
