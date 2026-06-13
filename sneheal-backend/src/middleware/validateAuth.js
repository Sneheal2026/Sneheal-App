const { validatePhone } = require('../utils/phone');
const { OTP_LENGTH } = require('../utils/otp');
const { fail } = require('../utils/response');

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

module.exports = {
  validateSendOtp,
  validateVerifyOtp,
};
