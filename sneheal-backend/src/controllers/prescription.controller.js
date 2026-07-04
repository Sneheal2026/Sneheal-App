const geminiService = require('../services/gemini.service');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

/**
 * Scan prescription or medicine image and extract medicine details
 * @route POST /api/prescriptions/scan
 */
const scanPrescription = async (req, res) => {
  if (!req.file) {
    throw new AppError(400, 'Image is required');
  }

  const { buffer, mimetype } = req.file;

  const { imageType, medicines } = await geminiService.extractMedicineNames(buffer, mimetype);

  const medicineNames = medicines.map((m) => m.correctedName);

  return success(res, 'Scan completed successfully', {
    imageType,
    medicines,
    medicineNames,
  });
};

module.exports = {
  scanPrescription,
};
