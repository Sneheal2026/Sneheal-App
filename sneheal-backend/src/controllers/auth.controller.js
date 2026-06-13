const authService = require('../services/auth.service');
const { success } = require('../utils/response');

const sendOtp = async (req, res) => {
  const data = await authService.sendOtp(req.body.phone);
  return success(res, 'OTP sent successfully', data);
};

const verifyOtp = async (req, res) => {
  const data = await authService.verifyOtp(req.body.phone, req.body.otp);
  return success(res, 'OTP verified', data);
};

module.exports = {
  sendOtp,
  verifyOtp,
};
