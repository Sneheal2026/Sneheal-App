const authService = require('../services/auth.service');
const registrationService = require('../services/registration.service');
const userRepo = require('../repositories/user.repository');
const { success, fail } = require('../utils/response');

const sendOtp = async (req, res) => {
  const data = await authService.sendOtp(req.body.phone);
  return success(res, 'OTP sent successfully', data);
};

const verifyOtp = async (req, res) => {
  const data = await authService.verifyOtp(req.body.phone, req.body.otp);
  return success(res, 'OTP verified', data);
};

const refreshSession = async (req, res) => {
  const data = await authService.refreshSession(req.body.refreshToken);
  return success(res, 'Session refreshed', data);
};

const completeRegistration = async (req, res) => {
  const userId = req.user.sub;
  const data = await registrationService.completeRegistration(userId, req.body);
  return success(res, 'Profile completed', data);
};

const getMe = async (req, res) => {
  const user = await userRepo.findById(req.user.sub);
  if (!user) {
    return fail(res, 404, 'User not found');
  }
  return success(res, 'User profile', { user });
};

module.exports = {
  sendOtp,
  verifyOtp,
  refreshSession,
  completeRegistration,
  getMe,
};
