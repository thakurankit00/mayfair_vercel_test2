const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Configure multer for room image uploads
const storage = multer.memoryStorage(); // Store in memory for processing

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// Image processing and storage utility
const processAndStoreImage = async (file, options = {}) => {
  const {
    width = 1200,
    height = 800,
    quality = 85,
    format = 'jpeg',
    folder = 'rooms'
  } = options;

  try {
    // Generate unique filename
    const fileId = uuidv4();
    const filename = `${fileId}.${format}`;
    
    // Create upload directory path
    const uploadDir = path.join(__dirname, '../../uploads', folder);
    await ensureDirectoryExists(uploadDir);
    
    // Create thumbnail directory
    const thumbnailDir = path.join(uploadDir, 'thumbnails');
    await ensureDirectoryExists(thumbnailDir);
    
    // Process main image
    const mainImagePath = path.join(uploadDir, filename);
    const processedImage = await sharp(file.buffer)
      .resize(width, height, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality })
      .toFile(mainImagePath);
    
    // Create thumbnail
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
    await sharp(file.buffer)
      .resize(300, 200, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    // Get file stats
    const stats = await fs.stat(mainImagePath);
    
    return {
      id: fileId,
      filename: filename,
      originalName: file.originalname,
      path: mainImagePath,
      relativePath: `uploads/${folder}/${filename}`,
      url: `/uploads/${folder}/${filename}`,
      thumbnailUrl: `/uploads/${folder}/thumbnails/${thumbnailFilename}`,
      size: stats.size,
      mimeType: `image/${format}`,
      width: processedImage.width,
      height: processedImage.height
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

// Middleware for single room image upload
const uploadSingleRoomImage = upload.single('image');

// Middleware for multiple room images upload
const uploadMultipleRoomImages = upload.array('images', 10);

// Delete image file utility
const deleteImageFile = async (imagePath) => {
  try {
    // Delete main image
    await fs.unlink(imagePath);
    
    // Delete thumbnail if exists
    const pathParts = imagePath.split(path.sep);
    const filename = pathParts.pop();
    const directory = pathParts.join(path.sep);
    const thumbnailPath = path.join(directory, 'thumbnails', `thumb_${filename}`);
    
    try {
      await fs.unlink(thumbnailPath);
    } catch (thumbnailError) {
      // Thumbnail might not exist, ignore error
      console.log('Thumbnail not found or already deleted:', thumbnailPath);
    }
  } catch (error) {
    console.error('Error deleting image file:', error);
    throw new Error('Failed to delete image file');
  }
};

// Validation middleware
const validateImageUpload = (req, res, next) => {
  // Check if files were uploaded
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILES_UPLOADED',
        message: 'No image files were uploaded'
      }
    });
  }
  
  // Validate room_type_id or room_id is provided
  const { room_type_id, room_id } = req.body;
  if (!room_type_id && !room_id) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_REFERENCE',
        message: 'Either room_type_id or room_id must be provided'
      }
    });
  }
  
  // Ensure only one reference is provided
  if (room_type_id && room_id) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MULTIPLE_REFERENCES',
        message: 'Only one of room_type_id or room_id should be provided'
      }
    });
  }
  
  next();
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 10MB limit'
        }
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Maximum 10 files allowed per upload'
        }
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UNEXPECTED_FIELD',
          message: 'Unexpected file field'
        }
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: error.message
      }
    });
  }
  
  next(error);
};

module.exports = {
  uploadSingleRoomImage,
  uploadMultipleRoomImages,
  processAndStoreImage,
  deleteImageFile,
  validateImageUpload,
  handleUploadError,
  ensureDirectoryExists
};
