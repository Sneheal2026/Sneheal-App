const express = require('express');
const adminController = require('../controllers/admin.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken, requireRole } = require('../middleware/validateAuth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public login route for admins with brute-force rate limiting
router.post('/auth/login', authLimiter, asyncHandler(adminController.login));

// Protected admin routes: requires valid JWT with role === 'admin'
router.get('/auth/me', authenticateToken, requireRole('admin'), asyncHandler(adminController.me));
router.get('/overview-stats', authenticateToken, requireRole('admin'), asyncHandler(adminController.getOverviewStats));

module.exports = router;
