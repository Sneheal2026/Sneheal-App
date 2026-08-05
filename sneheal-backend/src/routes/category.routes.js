const express = require('express');
const catalogController = require('../controllers/catalog.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List active product categories
 *     tags: [Catalog]
 *     responses:
 *       200:
 *         description: Categories fetched successfully
 */
router.get('/', asyncHandler(catalogController.listCategories));

module.exports = router;
