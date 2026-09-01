const express = require('express');
const authController = require('../controllers/auth.controller');
const asyncHandler = require('../utils/asyncHandler');
const {
  authenticateToken,
  validateSendOtp,
  validateVerifyOtp,
  validateRefreshToken,
  validateCompleteRegistration,
} = require('../middleware/validateAuth');
const { otpLimiter, refreshLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/send-otp', otpLimiter, validateSendOtp, asyncHandler(authController.sendOtp));
router.post('/verify-otp', otpLimiter, validateVerifyOtp, asyncHandler(authController.verifyOtp));
router.post(
  '/refresh',
  refreshLimiter,
  validateRefreshToken,
  asyncHandler(authController.refreshSession),
);
router.post(
  '/complete-registration',
  authenticateToken,
  validateCompleteRegistration,
  asyncHandler(authController.completeRegistration)
);

module.exports = router;
