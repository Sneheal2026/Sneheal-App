const express = require('express');
const paymentController = require('../controllers/payment.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/validateAuth');

const router = express.Router();

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Verify Razorpay checkout signature
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 */
router.post('/verify', authenticateToken, asyncHandler(paymentController.verifyPayment));

module.exports = router;
