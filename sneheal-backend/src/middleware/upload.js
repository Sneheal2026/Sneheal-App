const multer = require('multer');
const AppError = require('../utils/AppError');

// Store files in memory as buffers
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Only JPEG and PNG images are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Middleware to handle multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  next(err);
};

const uploadPrescriptionImage = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }

    return next();
  });
};

module.exports = {
  upload,
  uploadPrescriptionImage,
  handleUploadError,
};
