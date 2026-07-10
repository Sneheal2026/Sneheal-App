const db = require('../config/db');
const userRepo = require('../repositories/user.repository');
const doctorProfileRepo = require('../repositories/doctorProfile.repository');
const deliveryAgentProfileRepo = require('../repositories/deliveryAgentProfile.repository');
const tokenService = require('./token.service');
const AppError = require('../utils/AppError');
const { validateImageDocument } = require('../utils/base64Image');

const VALID_ROLES = new Set(['customer', 'doctor', 'delivery_agent']);
const VALID_LANGUAGES = new Set(['ENGLISH', 'HINDI', 'MARATHI']);
const PINCODE_REGEX = /^\d{6}$/;

const validateCommonFields = ({ username, language, role }) => {
  if (!username || typeof username !== 'string') {
    throw new AppError(400, 'Username is required');
  }

  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 2) {
    throw new AppError(400, 'Username must be at least 2 characters');
  }

  if (trimmedUsername.length > 100) {
    throw new AppError(400, 'Username must not exceed 100 characters');
  }

  if (!language || !VALID_LANGUAGES.has(language)) {
    throw new AppError(400, 'Language must be ENGLISH, HINDI, or MARATHI');
  }

  if (!role || !VALID_ROLES.has(role)) {
    throw new AppError(400, 'Role must be customer, doctor, or delivery_agent');
  }

  return { username: trimmedUsername, language, role };
};

const validateDoctorClinic = (clinic) => {
  if (!clinic || typeof clinic !== 'object') {
    throw new AppError(400, 'Clinic information is required for doctors');
  }

  const { addressLine, city, state, pincode, landmark = '' } = clinic;

  if (!addressLine || typeof addressLine !== 'string' || addressLine.trim().length < 5) {
    throw new AppError(400, 'Clinic address must be at least 5 characters');
  }

  if (!city || typeof city !== 'string' || city.trim().length < 2) {
    throw new AppError(400, 'City must be at least 2 characters');
  }

  if (!state || typeof state !== 'string' || state.trim().length < 2) {
    throw new AppError(400, 'State must be at least 2 characters');
  }

  if (!pincode || !PINCODE_REGEX.test(pincode)) {
    throw new AppError(400, 'Valid 6-digit pincode is required');
  }

  return {
    addressLine: addressLine.trim(),
    city: city.trim(),
    state: state.trim(),
    pincode: pincode.trim(),
    landmark: typeof landmark === 'string' ? landmark.trim() : '',
  };
};

const validateDeliveryAgentDocuments = (documents) => {
  if (!documents || typeof documents !== 'object') {
    throw new AppError(400, 'Documents are required for delivery agents');
  }

  const { aadhar, license } = documents;

  const validatedAadhar = validateImageDocument(aadhar, 'Aadhar card');
  const validatedLicense = validateImageDocument(license, 'Driving license');

  return {
    aadharImageBase64: validatedAadhar.base64,
    aadharMimeType: validatedAadhar.mimeType,
    licenseImageBase64: validatedLicense.base64,
    licenseMimeType: validatedLicense.mimeType,
  };
};

const completeRegistration = async (userId, payload) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const user = await userRepo.findByIdForUpdate(userId, connection);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.profileCompleted) {
      throw new AppError(409, 'Profile already completed');
    }

    if (user.role && user.role !== payload.role) {
      throw new AppError(409, 'Role cannot be changed once set');
    }

    const common = validateCommonFields(payload);

    if (common.role === 'doctor') {
      const clinic = validateDoctorClinic(payload.clinic);

      const existingProfile = await doctorProfileRepo.existsByUserId(userId, connection);
      if (existingProfile) {
        throw new AppError(409, 'Doctor profile already exists');
      }

      await doctorProfileRepo.create(userId, clinic, connection);
    }

    if (common.role === 'delivery_agent') {
      const documents = validateDeliveryAgentDocuments(payload.documents);

      const existingProfile = await deliveryAgentProfileRepo.existsByUserId(userId, connection);
      if (existingProfile) {
        throw new AppError(409, 'Delivery agent profile already exists');
      }

      await deliveryAgentProfileRepo.create(userId, documents, connection);
    }

    const updatedUser = await userRepo.completeProfile(userId, common, connection);
    const tokens = await tokenService.issueTokens(updatedUser, connection);

    await connection.commit();

    return {
      ...tokens,
      user: updatedUser,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  completeRegistration,
  validateCommonFields,
  validateDoctorClinic,
  validateDeliveryAgentDocuments,
  VALID_ROLES,
  VALID_LANGUAGES,
};
