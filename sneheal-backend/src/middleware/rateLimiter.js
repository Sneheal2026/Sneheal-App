const rateLimit = require('express-rate-limit');

const sharedLimiterOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
};

const otpLimiter = rateLimit({
  ...sharedLimiterOptions,
  max: 20,
});

const refreshLimiter = rateLimit({
  ...sharedLimiterOptions,
  max: 60,
});

const authLimiter = otpLimiter;

module.exports = { authLimiter, otpLimiter, refreshLimiter };
