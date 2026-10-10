const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const AppError = require('../utils/AppError');

// Ensure .env is loaded even if this module is required before app bootstrap
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const getConfig = () => ({
  cloud_name: String(process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: String(process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: String(process.env.CLOUDINARY_API_SECRET || '').trim(),
  folder: String(process.env.CLOUDINARY_FOLDER || 'Sneheall').trim() || 'Sneheall',
});

const ensureConfigured = () => {
  const { cloud_name, api_key, api_secret } = getConfig();

  if (!cloud_name || !api_key || !api_secret) {
    const missing = [
      !cloud_name && 'CLOUDINARY_CLOUD_NAME',
      !api_key && 'CLOUDINARY_API_KEY',
      !api_secret && 'CLOUDINARY_API_SECRET',
    ].filter(Boolean);

    throw new AppError(
      500,
      `Cloudinary is not configured (missing ${missing.join(', ')}). Restart the backend after updating .env.`,
    );
  }

  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
};

/**
 * Upload an image buffer to Cloudinary
 * @returns {{ imageUrl: string, publicId: string }}
 */
const uploadImage = (buffer, mimetype = 'image/jpeg') => {
  ensureConfigured();

  const { folder } = getConfig();
  const format = mimetype.includes('png') ? 'png' : 'jpg';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format,
      },
      (err, result) => {
        if (err || !result) {
          const detail = err?.message ? `: ${err.message}` : '';
          reject(new AppError(500, `Failed to upload image${detail}`));
          return;
        }

        resolve({
          imageUrl: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary by public_id (best-effort)
 */
const deleteImage = async (publicId) => deleteAsset(publicId, 'image');

/**
 * Upload a lab report (JPEG, PNG, or PDF) into the reports folder.
 * @returns {{ fileUrl: string, publicId: string, resourceType: 'image' | 'raw' }}
 */
const uploadHealthFile = (buffer, mimetype = 'application/pdf') => {
  ensureConfigured();

  const { folder } = getConfig();
  const isPdf = mimetype === 'application/pdf';
  const isPng = mimetype.includes('png');
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const options = isPdf
    ? {
        resource_type: 'raw',
        public_id: `${folder}/reports/${stamp}.pdf`,
        unique_filename: false,
      }
    : {
        folder: `${folder}/reports`,
        resource_type: 'image',
        format: isPng ? 'png' : 'jpg',
      };

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err || !result) {
        const detail = err?.message ? `: ${err.message}` : '';
        reject(new AppError(500, `Failed to upload report${detail}`));
        return;
      }

      resolve({
        fileUrl: result.secure_url,
        publicId: result.public_id,
        resourceType: isPdf ? 'raw' : 'image',
      });
    });

    stream.end(buffer);
  });
};

/**
 * Delete a Cloudinary asset (best-effort). resourceType is 'image' or 'raw'.
 */
const deleteAsset = async (publicId, resourceType = 'image') => {
  if (!publicId) return;

  try {
    ensureConfigured();
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType === 'raw' ? 'raw' : 'image',
    });
  } catch {
    // Ignore remote delete failures; DB row is still removed
  }
};

module.exports = {
  uploadImage,
  uploadHealthFile,
  deleteImage,
  deleteAsset,
};
