const crypto = require('crypto');

const OTP_LENGTH = 6;

const generateOtp = () => {
  const max = 10 ** OTP_LENGTH;
  const code = crypto.randomInt(0, max);
  return String(code).padStart(OTP_LENGTH, '0');
};

const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const verifyOtpHash = (otp, hashedOtp) => {
  const inputHash = hashOtp(otp);
  return crypto.timingSafeEqual(
    Buffer.from(inputHash, 'hex'),
    Buffer.from(hashedOtp, 'hex')
  );
};

module.exports = {
  OTP_LENGTH,
  generateOtp,
  hashOtp,
  verifyOtpHash,
};
