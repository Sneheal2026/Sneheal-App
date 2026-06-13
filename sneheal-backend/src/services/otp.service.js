const otpRepo = require('../repositories/otp.repository');
const { generateOtp, hashOtp, verifyOtpHash } = require('../utils/otp');
const { sendSms, isDevMode } = require('./sms.service');
const AppError = require('../utils/AppError');

const getOtpExpiresMinutes = () => Number(process.env.OTP_EXPIRES_MINUTES) || 5;
const getResendCooldownSeconds = () => Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 30;
const getMaxAttempts = () => Number(process.env.OTP_MAX_ATTEMPTS) || 5;

const checkResendCooldown = async (phone) => {
  const lastSentAt = await otpRepo.getLastSentAt(phone);
  if (!lastSentAt) return;

  const cooldownMs = getResendCooldownSeconds() * 1000;
  const elapsed = Date.now() - new Date(lastSentAt).getTime();

  if (elapsed < cooldownMs) {
    const waitSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
    throw new AppError(429, `Please wait ${waitSeconds}s before requesting a new OTP`);
  }
};

const sendOtp = async (phone) => {
  await checkResendCooldown(phone);

  const plainOtp = generateOtp();
  const hashedOtp = hashOtp(plainOtp);

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + getOtpExpiresMinutes());

  await otpRepo.invalidatePreviousOtps(phone);
  await otpRepo.createOtp(phone, hashedOtp, expiresAt);
  await sendSms(phone, plainOtp);

  const result = { resendAfterSeconds: getResendCooldownSeconds() };

  if (isDevMode()) {
    result.devOtp = plainOtp;
  }

  return result;
};

const verifyOtpRecord = async (phone, otp, connection) => {
  const record = await otpRepo.findActiveOtp(phone, connection);

  if (!record) {
    throw new AppError(401, 'OTP not found or expired. Please request a new one');
  }

  let isValid = false;
  try {
    isValid = verifyOtpHash(otp, record.otp);
  } catch {
    isValid = false;
  }

  if (!isValid) {
    await otpRepo.incrementAttempts(record.id, connection);
    const remaining = getMaxAttempts() - (record.attempts + 1);

    if (remaining <= 0) {
      await otpRepo.markUsed(record.id, connection);
      throw new AppError(401, 'Maximum OTP attempts exceeded. Please request a new OTP');
    }

    throw new AppError(401, `Invalid OTP. ${remaining} attempt(s) remaining`);
  }

  await otpRepo.markUsed(record.id, connection);
  return true;
};

module.exports = {
  sendOtp,
  verifyOtpRecord,
};
