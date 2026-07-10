const AppError = require('./AppError');

const MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

const DATA_URI_REGEX = /^data:(image\/[a-zA-Z+]+);base64,/;

const stripDataUriPrefix = (input) => {
  if (!input || typeof input !== 'string') {
    return { base64: '', mimeFromPrefix: null };
  }

  const match = input.match(DATA_URI_REGEX);
  if (match) {
    return {
      base64: input.slice(match[0].length),
      mimeFromPrefix: match[1],
    };
  }

  return { base64: input, mimeFromPrefix: null };
};

const isValidBase64 = (str) => {
  if (!str || typeof str !== 'string') return false;
  try {
    const decoded = Buffer.from(str, 'base64').toString('base64');
    return decoded === str.replace(/\s/g, '');
  } catch {
    return false;
  }
};

const getDecodedSize = (base64) => {
  if (!base64) return 0;
  const padding = (base64.match(/=+$/) || [''])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
};

const validateImageDocument = (doc, fieldName) => {
  if (!doc || typeof doc !== 'object') {
    throw new AppError(400, `${fieldName} document is required`);
  }

  const { mimeType, base64: rawBase64 } = doc;

  if (!rawBase64 || typeof rawBase64 !== 'string') {
    throw new AppError(400, `${fieldName} base64 data is required`);
  }

  const { base64, mimeFromPrefix } = stripDataUriPrefix(rawBase64);

  const effectiveMime = mimeType || mimeFromPrefix;
  if (!effectiveMime) {
    throw new AppError(400, `${fieldName} mimeType is required`);
  }

  const normalizedMime = effectiveMime.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
    throw new AppError(400, `${fieldName} must be JPEG or PNG (got ${effectiveMime})`);
  }

  if (!isValidBase64(base64)) {
    throw new AppError(400, `${fieldName} contains invalid base64 data`);
  }

  const decodedSize = getDecodedSize(base64);
  if (decodedSize > MAX_IMAGE_BYTES) {
    const sizeMB = (decodedSize / (1024 * 1024)).toFixed(2);
    throw new AppError(400, `${fieldName} exceeds 1 MB limit (${sizeMB} MB)`);
  }

  if (decodedSize < 1000) {
    throw new AppError(400, `${fieldName} image is too small or corrupted`);
  }

  return {
    base64,
    mimeType: normalizedMime === 'image/jpg' ? 'image/jpeg' : normalizedMime,
  };
};

module.exports = {
  MAX_IMAGE_BYTES,
  ALLOWED_MIME_TYPES,
  stripDataUriPrefix,
  isValidBase64,
  getDecodedSize,
  validateImageDocument,
};
