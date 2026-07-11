const geminiService = require('../services/gemini.service');
const prescriptionService = require('../services/prescription.service');
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

/**
 * Save prescription image to Cloudinary + MySQL
 * @route POST /api/prescriptions
 */
const savePrescription = async (req, res) => {
  const prescription = await prescriptionService.savePrescription(req.user.sub, req.file);
  return success(res, 'Prescription saved successfully', prescription, 201);
};

/**
 * List saved prescriptions for the authenticated user
 * @route GET /api/prescriptions
 */
const listPrescriptions = async (req, res) => {
  const prescriptions = await prescriptionService.listPrescriptions(req.user.sub);
  return success(res, 'Prescriptions fetched successfully', prescriptions);
};

/**
 * Delete a saved prescription
 * @route DELETE /api/prescriptions/:id
 */
const deletePrescription = async (req, res) => {
  const result = await prescriptionService.deletePrescription(req.user.sub, req.params.id);
  return success(res, 'Prescription deleted successfully', result);
};

module.exports = {
  scanPrescription,
  savePrescription,
  listPrescriptions,
  deletePrescription,
};
