const express = require('express');
const addressController = require('../controllers/address.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/validateAuth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: User delivery addresses
 */

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: List saved delivery addresses for the authenticated user
 *     tags: [Addresses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, asyncHandler(addressController.listAddresses));

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Create a delivery address
 *     tags: [Addresses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Address created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, asyncHandler(addressController.createAddress));

/**
 * @swagger
 * /api/addresses/{id}:
 *   put:
 *     summary: Update a delivery address
 *     tags: [Addresses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       404:
 *         description: Address not found
 */
router.put('/:id', authenticateToken, asyncHandler(addressController.updateAddress));

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Delete a delivery address
 *     tags: [Addresses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       404:
 *         description: Address not found
 */
router.delete('/:id', authenticateToken, asyncHandler(addressController.deleteAddress));

module.exports = router;
