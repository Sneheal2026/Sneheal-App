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
 */
router.post(
  '/scan',
  authenticateToken,
  uploadPrescriptionImage,
  asyncHandler(prescriptionController.scanPrescription),
);

/**
 * @swagger
 * /api/prescriptions:
 *   get:
 *     summary: List saved prescription images
 *     tags: [Prescriptions]
 *     security:
 *       - BearerAuth: []
 */
router.get('/', authenticateToken, asyncHandler(prescriptionController.listPrescriptions));

/**
 * @swagger
 * /api/prescriptions:
 *   post:
 *     summary: Upload and save a prescription image
 *     tags: [Prescriptions]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  '/',
  authenticateToken,
  uploadPrescriptionImage,
  asyncHandler(prescriptionController.savePrescription),
);

/**
 * @swagger
 * /api/prescriptions/{id}:
 *   delete:
 *     summary: Delete a saved prescription
 *     tags: [Prescriptions]
 *     security:
 *       - BearerAuth: []
 */
router.delete(
  '/:id',
  authenticateToken,
  asyncHandler(prescriptionController.deletePrescription),
);

module.exports = router;
