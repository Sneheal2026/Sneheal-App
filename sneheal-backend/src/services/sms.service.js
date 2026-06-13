const sendSms = async (phone, otp) => {
  // TODO: integrate SMS provider (MSG91, Twilio, etc.)
  console.log('');
  console.log('========================================');
  console.log(`[DEV OTP] Phone: ${phone}`);
  console.log(`[DEV OTP] Code:  ${otp}`);
  console.log('========================================');
  console.log('');
};

const isDevMode = () => process.env.NODE_ENV !== 'production';

module.exports = { sendSms, isDevMode };
