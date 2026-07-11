const prescriptionRepo = require('../repositories/prescription.repository');
const cloudinaryService = require('./cloudinary.service');
const AppError = require('../utils/AppError');

const listPrescriptions = async (userId) => {
  return prescriptionRepo.findByUserId(userId);
};

const savePrescription = async (userId, file) => {
  if (!file || !file.buffer) {
    throw new AppError(400, 'Image is required');
  }

  const { imageUrl, publicId } = await cloudinaryService.uploadImage(
    file.buffer,
    file.mimetype,
  );

  return prescriptionRepo.create(userId, {
    imageUrl,
    cloudinaryPublicId: publicId,
  });
};

const deletePrescription = async (userId, id) => {
  const existing = await prescriptionRepo.findByIdAndUserId(id, userId);

  if (!existing) {
    throw new AppError(404, 'Prescription not found');
  }

  await prescriptionRepo.remove(id, userId);
  await cloudinaryService.deleteImage(existing.cloudinaryPublicId);

  return { deleted: true };
};

module.exports = {
  listPrescriptions,
  savePrescription,
  deletePrescription,
};
