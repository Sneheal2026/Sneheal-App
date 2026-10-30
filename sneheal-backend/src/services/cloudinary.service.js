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
  const normalized = String(mimetype || '').toLowerCase();
  const isPdf = normalized === 'application/pdf' || normalized === 'application/x-pdf';
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

/**
 * Extract Cloudinary public_id from a delivery URL (unsigned or signed).
 */
const parsePublicIdFromDeliveryUrl = (url) => {
  if (!url) return null;

  try {
    let pathname = new URL(url).pathname;
    // Signed delivery URLs embed `/s--{signature}--/` before the version/public_id segment.
    pathname = pathname.replace(/\/s--[^/]+--\//, '/');
    const match = pathname.match(/\/(?:image|raw)\/(upload|authenticated)\/(?:v\d+\/)?(.+)$/);
    if (!match?.[2]) return null;
    return decodeURIComponent(match[2]);
  } catch {
    return null;
  }
};

const resourceTypesToTry = (hint) => {
  const normalized = String(hint || '').trim().toLowerCase();
  if (normalized === 'raw') return ['raw', 'image'];
  if (normalized === 'image') return ['image', 'raw'];
  return ['raw', 'image'];
};

/**
 * Download report bytes via Cloudinary Admin API metadata (version + delivery type)
 * so signed URLs match what Cloudinary expects.
 */
const fetchReportBuffer = async (publicId, resourceTypeHint = 'raw') => {
  if (!publicId) {
    throw new AppError(400, 'Report file reference is missing');
  }

  ensureConfigured();
  let lastError;

  for (const resourceType of resourceTypesToTry(resourceTypeHint)) {
    try {
      const meta = await cloudinary.api.resource(publicId, { resource_type: resourceType });
      const deliveryType = meta.type || 'upload';
      const signedUrl = cloudinary.url(meta.public_id, {
        resource_type: meta.resource_type || resourceType,
        type: deliveryType,
        version: meta.version,
        sign_url: true,
        secure: true,
      });

      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new AppError(502, `Could not fetch report file (${response.status})`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 32) {
        throw new AppError(502, 'Downloaded report file is empty');
      }

      return buffer;
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError instanceof AppError) throw lastError;
  const detail = lastError?.message ? `: ${lastError.message}` : '';
  throw new AppError(502, `Could not download report from storage${detail}`);
};

/**
 * Signed delivery URL for doctor/customer report access (raw PDFs often 401 without signing).
 */
const getSignedReportUrl = (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  ensureConfigured();
  const normalized = String(resourceType || '').trim().toLowerCase();
  const type = normalized === 'raw' ? 'raw' : 'image';
  return cloudinary.url(publicId, {
    resource_type: type,
    type: 'upload',
    sign_url: true,
    secure: true,
  });
};

module.exports = {
  uploadImage,
  uploadHealthFile,
  deleteImage,
  deleteAsset,
  getSignedReportUrl,
  parsePublicIdFromDeliveryUrl,
  fetchReportBuffer,
};
