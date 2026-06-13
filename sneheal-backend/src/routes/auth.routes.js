const express = require('express');
const authController = require('../controllers/auth.controller');
const asyncHandler = require('../utils/asyncHandler');
const { validateSendOtp, validateVerifyOtp } = require('../middleware/validateAuth');

const router = express.Router();

router.post('/send-otp', validateSendOtp, asyncHandler(authController.sendOtp));
router.post('/verify-otp', validateVerifyOtp, asyncHandler(authController.verifyOtp));

module.exports = router;
