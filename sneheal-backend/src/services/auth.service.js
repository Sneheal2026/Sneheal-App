const db = require('../config/db');
const otpService = require('./otp.service');
const tokenService = require('./token.service');
const userRepo = require('../repositories/user.repository');
const refreshTokenRepo = require('../repositories/refreshToken.repository');
const { validatePhone } = require('../utils/phone');
const AppError = require('../utils/AppError');
const { OTP_LENGTH } = require('../utils/otp');

const sendOtp = async (phoneInput) => {
  const validation = validatePhone(phoneInput);
  if (!validation.valid) {
    throw new AppError(400, validation.message);
  }

  return otpService.sendOtp(validation.phone);
};

const verifyOtp = async (phoneInput, otp) => {
  const validation = validatePhone(phoneInput);
  if (!validation.valid) {
    throw new AppError(400, validation.message);
  }

  if (!otp || !new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp)) {
    throw new AppError(400, `Valid ${OTP_LENGTH}-digit OTP is required`);
  }

  const phone = validation.phone;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await otpService.verifyOtpRecord(phone, otp, connection);

    let user = await userRepo.findByPhone(phone, connection);
    if (!user) {
      user = await userRepo.createByPhone(phone, connection);
    }

    const tokens = await tokenService.issueTokens(user, connection);

    await connection.commit();

    return {
      ...tokens,
      user,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const refreshSession = async (refreshToken) => {
  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new AppError(400, 'Refresh token is required');
  }

  const tokenRecord = await refreshTokenRepo.findByToken(refreshToken);

  if (!tokenRecord) {
    throw new AppError(401, 'Invalid refresh token');
  }

  if (new Date(tokenRecord.expires_at).getTime() <= Date.now()) {
    await refreshTokenRepo.deleteByToken(refreshToken);
    throw new AppError(401, 'Refresh token expired');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const user = await userRepo.findById(tokenRecord.user_id, connection);

    if (!user) {
      await refreshTokenRepo.deleteByToken(refreshToken, connection);
      throw new AppError(401, 'User not found');
    }

    const tokens = await tokenService.issueTokens(user, connection);

    await connection.commit();

    return {
      ...tokens,
      user,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  refreshSession,
};
