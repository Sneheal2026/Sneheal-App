const jwt = require('jsonwebtoken');
const { validatePhone } = require('../utils/phone');
const { OTP_LENGTH } = require('../utils/otp');
const { fail } = require('../utils/response');
const AppError = require('../utils/AppError');

/**
 * Middleware to verify JWT token from Authorization header
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, 401, 'Authentication required');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to request
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return fail(res, 401, 'Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return fail(res, 401, 'Invalid token');
    }
    return fail(res, 401, 'Authentication failed');
  }
};

const validateSendOtp = (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return fail(res, 400, 'Phone number is required');
  }

  const validation = validatePhone(phone);
  if (!validation.valid) {
    return fail(res, 400, validation.message);
  }

  req.normalizedPhone = validation.phone;
  next();
};

const validateVerifyOtp = (req, res, next) => {
  const { phone, otp } = req.body;

  if (!phone) {
    return fail(res, 400, 'Phone number is required');
  }

  const validation = validatePhone(phone);
  if (!validation.valid) {
    return fail(res, 400, validation.message);
  }

  if (!otp || !new RegExp(`^\\d{${OTP_LENGTH}}$`).test(String(otp))) {
    return fail(res, 400, `Valid ${OTP_LENGTH}-digit OTP is required`);
  }

  req.normalizedPhone = validation.phone;
  next();
};

const validateRefreshToken = (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== 'string' || !refreshToken.trim()) {
    return fail(res, 400, 'Refresh token is required');
  }

  req.body.refreshToken = refreshToken.trim();
  next();
};

const VALID_ROLES = new Set(['customer', 'doctor', 'delivery_agent']);
const VALID_LANGUAGES = new Set(['ENGLISH', 'HINDI', 'MARATHI']);

const validateCompleteRegistration = (req, res, next) => {
  const { username, language, role, clinic, documents } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 2) {
    return fail(res, 400, 'Username must be at least 2 characters');
  }

  if (!language || !VALID_LANGUAGES.has(language)) {
    return fail(res, 400, 'Language must be ENGLISH, HINDI, or MARATHI');
  }

  if (!role || !VALID_ROLES.has(role)) {
    return fail(res, 400, 'Role must be customer, doctor, or delivery_agent');
  }

  if (role === 'doctor' && (!clinic || typeof clinic !== 'object')) {
    return fail(res, 400, 'Clinic information is required for doctors');
  }

  if (role === 'delivery_agent' && (!documents || typeof documents !== 'object')) {
    return fail(res, 400, 'Documents are required for delivery agents');
  }

  if (role === 'delivery_agent') {
    const { aadhar, license } = documents;
    if (!aadhar || !aadhar.base64) {
      return fail(res, 400, 'Aadhar card image is required');
    }
    if (!license || !license.base64) {
      return fail(res, 400, 'Driving license image is required');
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  validateSendOtp,
  validateVerifyOtp,
  validateRefreshToken,
  validateCompleteRegistration,
};
