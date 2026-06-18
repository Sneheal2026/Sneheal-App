const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescription.controller');
const { uploadPrescriptionImage } = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/validateAuth');

/**
 * @swagger
 * /api/prescriptions/scan:
 *   post:
 *     summary: Scan prescription image and extract medicine names
 *     tags: [Prescriptions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Prescription image (JPEG or PNG, max 10MB)
 *     responses:
 *       200:
 *         description: Prescription scanned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     medicineNames:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Bad request (no file, invalid format, file too large)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error or AI service error
 */
router.post(
  '/scan',
  authenticateToken,
  uploadPrescriptionImage,
  asyncHandler(prescriptionController.scanPrescription)
);

module.exports = router;
