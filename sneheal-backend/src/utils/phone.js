const PHONE_REGEX = /^[6-9]\d{9}$/;
const COUNTRY_CODE = '+91';

const normalizePhone = (phone) => {
  const digits = String(phone).replace(/\D/g, '').slice(-10);
  if (!PHONE_REGEX.test(digits)) {
    return null;
  }
  return `${COUNTRY_CODE}${digits}`;
};

const validatePhone = (phone) => {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { valid: false, message: 'Valid 10-digit Indian mobile number is required' };
  }
  return { valid: true, phone: normalized };
};

module.exports = {
  PHONE_REGEX,
  normalizePhone,
  validatePhone,
};
