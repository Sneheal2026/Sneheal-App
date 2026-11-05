const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const homeScreenImageController = require('../controllers/homeScreenImage.controller');

const router = express.Router();

/**
 * @swagger
 * /api/home/images:
 *   get:
 *     summary: Remote CDN URLs for Home festive decorations
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Home images fetched successfully
 */
router.get('/images', asyncHandler(homeScreenImageController.listHomeImages));

module.exports = router;
