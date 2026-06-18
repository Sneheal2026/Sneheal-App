const geminiService = require('../services/gemini.service');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

/**
 * Scan prescription image and extract medicine names
 * @route POST /api/prescriptions/scan
 */
const scanPrescription = async (req, res) => {
  // Check if file was uploaded
  if (!req.file) {
    throw new AppError(400, 'Prescription image is required');
  }

  const { buffer, mimetype } = req.file;

  // Extract medicine names using Gemini Vision
  const medicineNames = await geminiService.extractMedicineNames(buffer, mimetype);

  return success(res, 'Prescription scanned successfully', {
    medicineNames,
  });
};

module.exports = {
  scanPrescription,
};
