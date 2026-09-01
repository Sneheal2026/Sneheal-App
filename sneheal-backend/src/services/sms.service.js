const sendSms = async (phone, otp) => {
  // TODO: integrate SMS provider (MSG91, Twilio, etc.)
  console.log('');
  console.log('========================================');
  console.log(`[DEV OTP] Phone: ${phone}`);
  console.log(`[DEV OTP] Code:  ${otp}`);
  console.log('========================================');
  console.log('');
};

/** Dummy OTP on the app screen. Set SHOW_DEV_OTP=true on Railway until MSG91. */
const isDevMode = () =>
  process.env.NODE_ENV !== 'production' || process.env.SHOW_DEV_OTP === 'true';

module.exports = { sendSms, isDevMode };
