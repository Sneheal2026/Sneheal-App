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
 * Upload a lab report photo (JPEG or PNG) into the reports folder.
 * @returns {{ fileUrl: string, publicId: string, resourceType: 'image' }}
 */
const uploadHealthFile = (buffer, mimetype = 'image/jpeg') => {
  ensureConfigured();

  const { folder } = getConfig();
  const normalized = String(mimetype || '').toLowerCase();
  if (normalized === 'application/pdf' || normalized === 'application/x-pdf') {
    throw new AppError(400, 'PDF uploads are not supported. Please upload a JPEG or PNG photo.');
  }

  const isPng = normalized.includes('png');
  const isJpeg =
    normalized === 'image/jpeg' ||
    normalized === 'image/jpg' ||
    (!isPng && normalized.startsWith('image/'));

  if (!isPng && !isJpeg) {
    throw new AppError(400, 'Only JPEG and PNG photos are allowed');
  }

  const options = {
    folder: `${folder}/reports`,
    resource_type: 'image',
    format: isPng ? 'png' : 'jpg',
    type: 'upload',
    access_mode: 'public',
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
        resourceType: 'image',
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

const resourceFormatForDownload = (meta) => {
  if (meta.format) return meta.format;
  const id = String(meta.public_id || '').toLowerCase();
  if (id.endsWith('.pdf')) return 'pdf';
  if (id.endsWith('.png')) return 'png';
  if (id.endsWith('.jpg') || id.endsWith('.jpeg')) return 'jpg';
  return meta.resource_type === 'raw' ? 'pdf' : 'jpg';
};

const fetchBufferFromUrl = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError(502, `Could not fetch report file (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 32) {
    throw new AppError(502, 'Downloaded report file is empty');
  }
  return buffer;
};

const buildDownloadAttempts = (meta) => {
  const { api_key } = getConfig();
  ensureConfigured();

  const resourceType = meta.resource_type || 'raw';
  const deliveryType = meta.type || 'upload';
  const format = resourceFormatForDownload(meta);
  const urls = [];
  const push = (value) => {
    const trimmed = String(value || '').trim();
    if (trimmed && !urls.includes(trimmed)) urls.push(trimmed);
  };

  // Admin-signed download URL — works when CDN signed URLs return 401 (restricted delivery).
  push(
    cloudinary.utils.private_download_url(meta.public_id, format, {
      resource_type: resourceType,
      type: deliveryType,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }),
  );

  if (typeof cloudinary.utils.generate_auth_token === 'function') {
    const authToken = cloudinary.utils.generate_auth_token({
      key: api_key,
      duration: 3600,
    });
    push(
      cloudinary.url(meta.public_id, {
        resource_type: resourceType,
        type: deliveryType,
        version: meta.version,
        auth_token: authToken,
        secure: true,
      }),
    );
  }

  push(meta.secure_url);

  push(
    cloudinary.url(meta.public_id, {
      resource_type: resourceType,
      type: deliveryType,
      version: meta.version,
      sign_url: true,
      secure: true,
    }),
  );

  return urls;
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

      for (const url of buildDownloadAttempts(meta)) {
        try {
          return await fetchBufferFromUrl(url);
        } catch (err) {
          lastError = err;
        }
      }
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
