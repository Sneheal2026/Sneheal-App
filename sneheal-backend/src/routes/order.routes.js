const express = require('express');
const orderController = require('../controllers/order.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken, requireRole } = require('../middleware/validateAuth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Checkout orders
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Place a Cash on Delivery order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 */
router.post('/', authenticateToken, asyncHandler(orderController.createOrder));

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: List orders for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 */
router.get('/', authenticateToken, asyncHandler(orderController.listOrders));

/**
 * @swagger
 * /api/orders/delivery/queue:
 *   get:
 *     summary: List pending and recently delivered orders for delivery partners
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 */
router.get(
  '/delivery/queue',
  authenticateToken,
  requireRole('delivery_agent'),
  asyncHandler(orderController.listDeliveryQueue),
);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update fulfillment status (delivery partner)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 */
router.patch(
  '/:id/status',
  authenticateToken,
  requireRole('delivery_agent'),
  asyncHandler(orderController.updateStatus),
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get a single order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 */
router.get('/:id', authenticateToken, asyncHandler(orderController.getOrder));

module.exports = router;
