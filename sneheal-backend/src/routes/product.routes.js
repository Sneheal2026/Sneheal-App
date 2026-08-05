const express = require('express');
const catalogController = require('../controllers/catalog.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Catalog
 *   description: Product catalog (public read)
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List products
 *     tags: [Catalog]
 *     parameters:
 *       - in: query
 *         name: featured
 *         schema: { type: boolean }
 *       - in: query
 *         name: categoryId
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, maximum: 50, default: 20 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Paginated products ({ items, total, limit, offset, hasMore })
 */
router.get('/', asyncHandler(catalogController.listProducts));

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Search products by name, brand, generic or uses
 *     tags: [Catalog]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Products fetched successfully
 */
router.get('/search', asyncHandler(catalogController.searchProducts));

/**
 * @swagger
 * /api/products/{id}/similar:
 *   get:
 *     summary: List products similar to the given product
 *     tags: [Catalog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Similar products fetched successfully
 */
router.get('/:id/similar', asyncHandler(catalogController.getSimilarProducts));

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product by id
 *     tags: [Catalog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *       404:
 *         description: Product not found
 */
router.get('/:id', asyncHandler(catalogController.getProduct));

module.exports = router;
