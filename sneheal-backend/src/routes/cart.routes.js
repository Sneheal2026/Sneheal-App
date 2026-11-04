const express = require('express');
const cartController = require('../controllers/cart.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/validateAuth');

const router = express.Router();

router.get(
  '/promotions',
  authenticateToken,
  asyncHandler(cartController.listPromotions),
);

router.post('/quote', authenticateToken, asyncHandler(cartController.quote));

module.exports = router;
