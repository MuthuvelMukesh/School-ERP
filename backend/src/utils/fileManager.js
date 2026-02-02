/**
 * File Management Service
 * Handles file uploads, storage, and retrieval
 * Supports: Local storage, AWS S3, and other cloud providers
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const logger = require('./logger');

// Configuration
const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  ALLOWED_EXTENSIONS: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'],
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads'
};

// Initialize upload directories
const initializeUploadDirs = () => {
  const dirs = [
    FILE_CONFIG.UPLOAD_DIR,
    path.join(FILE_CONFIG.UPLOAD_DIR, 'students'),
    path.join(FILE_CONFIG.UPLOAD_DIR, 'staff'),
    path.join(FILE_CONFIG.UPLOAD_DIR, 'documents'),
    path.join(FILE_CONFIG.UPLOAD_DIR, 'reports')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created upload directory: ${dir}`);
    }
  });
};

// Initialize directories on module load
initializeUploadDirs();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = FILE_CONFIG.UPLOAD_DIR;
    
    // Determine subdirectory based on context
    if (req.body.type === 'student') {
      uploadPath = path.join(uploadPath, 'students');
    } else if (req.body.type === 'staff') {
      uploadPath = path.join(uploadPath, 'staff');
    } else if (req.body.type === 'document') {
      uploadPath = path.join(uploadPath, 'documents');
    } else if (req.body.type === 'report') {
      uploadPath = path.join(uploadPath, 'reports');
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  // Validate file type
  if (!FILE_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }

  // Validate file extension
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (!FILE_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`File extension .${ext} not allowed`), false);
  }

  cb(null, true);
};

// Create multer middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_CONFIG.MAX_FILE_SIZE
  }
});

/**
 * Handle single file upload
 */
exports.uploadSingleFile = upload.single('file');

/**
 * Handle multiple file uploads
 */
exports.uploadMultipleFiles = upload.array('files', 10); // Max 10 files

/**
 * Save file metadata to database
 */
exports.saveFileMetadata = async (prisma, fileData, userId) => {
  try {
    // This will be used when you have a FileMetadata table in schema
    // For now, return the file info
    return {
      filename: fileData.filename,
      originalName: fileData.originalname,
      size: fileData.size,
      mimetype: fileData.mimetype,
      path: fileData.path,
      uploadedAt: new Date(),
      uploadedBy: userId
    };
  } catch (error) {
    logger.error('Error saving file metadata:', error);
    throw error;
  }
};

/**
 * Delete file from storage
 */
exports.deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(FILE_CONFIG.UPLOAD_DIR, filePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info(`Deleted file: ${fullPath}`);
      return true;
    }

    logger.warn(`File not found: ${fullPath}`);
    return false;
  } catch (error) {
    logger.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get file from storage
 */
exports.getFile = (filePath) => {
  try {
    const fullPath = path.join(FILE_CONFIG.UPLOAD_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    return {
      path: fullPath,
      stats: fs.statSync(fullPath)
    };
  } catch (error) {
    logger.error('Error getting file:', error);
    return null;
  }
};

/**
 * AWS S3 upload (optional - requires aws-sdk)
 */
let s3Client = null;

exports.initializeS3 = () => {
  try {
    if (process.env.USE_S3 === 'true') {
      const AWS = require('aws-sdk');
      s3Client = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
      logger.info('AWS S3 client initialized');
    }
  } catch (error) {
    logger.warn('AWS S3 not configured. Using local storage.', error.message);
  }
};

/**
 * Upload to S3
 */
exports.uploadToS3 = async (file) => {
  if (!s3Client) {
    throw new Error('S3 client not initialized');
  }

  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `documents/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private'
    };

    const result = await s3Client.upload(params).promise();
    logger.info(`File uploaded to S3: ${result.Key}`);
    
    return {
      url: result.Location,
      key: result.Key,
      size: file.size
    };
  } catch (error) {
    logger.error('S3 upload error:', error);
    throw error;
  }
};

/**
 * Validate file before upload
 */
exports.validateFile = (file) => {
  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return { valid: false, errors };
  }

  if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum limit of ${FILE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  if (!FILE_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} not allowed`);
  }

  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (!FILE_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    errors.push(`File extension .${ext} not allowed`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Get file type category
 */
exports.getFileCategory = (filename) => {
  const ext = path.extname(filename).toLowerCase().slice(1);
  
  const categories = {
    image: ['jpg', 'jpeg', 'png', 'gif'],
    document: ['pdf', 'doc', 'docx', 'txt'],
    spreadsheet: ['xls', 'xlsx', 'csv'],
    video: ['mp4', 'avi', 'mov', 'mkv'],
    archive: ['zip', 'rar', '7z', 'tar']
  };

  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }

  return 'other';
};

/**
 * Get upload directory size
 */
exports.getUploadDirSize = () => {
  try {
    let totalSize = 0;

    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          walkDir(filePath);
        } else {
          totalSize += stats.size;
        }
      });
    };

    walkDir(FILE_CONFIG.UPLOAD_DIR);

    return {
      bytes: totalSize,
      mb: (totalSize / 1024 / 1024).toFixed(2),
      gb: (totalSize / 1024 / 1024 / 1024).toFixed(2)
    };
  } catch (error) {
    logger.error('Error calculating upload directory size:', error);
    return null;
  }
};

/**
 * Cleanup old files (for maintenance)
 */
exports.cleanupOldFiles = (daysOld = 30) => {
  try {
    const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          walkDir(filePath);
        } else if (stats.mtime.getTime() < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.info(`Deleted old file: ${filePath}`);
        }
      });
    };

    walkDir(FILE_CONFIG.UPLOAD_DIR);

    return {
      deletedCount,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Error cleaning up old files:', error);
    return null;
  }
};

// Initialize S3 on module load if configured
exports.initializeS3();

module.exports = exports;
