const healthReportRepo = require('../repositories/healthReport.repository');
const cloudinaryService = require('./cloudinary.service');
const AppError = require('../utils/AppError');

const MAX_REPORTS = 40;

const cleanTitle = (value, fallbackName) => {
  const fromBody = typeof value === 'string' ? value : '';
  const fromFile = typeof fallbackName === 'string' ? fallbackName.replace(/\.[^.]+$/, '') : '';
  const raw = (fromBody || fromFile || 'Lab report').replace(/[\r\n\t]+/g, ' ').trim();
  return raw.slice(0, 120) || 'Lab report';
};

const listReports = async (userId) => healthReportRepo.findByUserId(userId);

const saveReport = async (userId, file, title) => {
  if (!file || !file.buffer) {
    throw new AppError(400, 'File is required');
  }

  const count = await healthReportRepo.countByUserId(userId);
  if (count >= MAX_REPORTS) {
    throw new AppError(400, `You can save up to ${MAX_REPORTS} reports`);
  }

  const uploaded = await cloudinaryService.uploadHealthFile(file.buffer, file.mimetype);

  return healthReportRepo.create(userId, {
    title: cleanTitle(title, file.originalname),
    fileUrl: uploaded.fileUrl,
    cloudinaryPublicId: uploaded.publicId,
    resourceType: uploaded.resourceType,
    mimeType: file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype,
  });
};

const deleteReport = async (userId, id) => {
  const existing = await healthReportRepo.findByIdAndUserId(id, userId);

  if (!existing) {
    throw new AppError(404, 'Report not found');
  }

  await healthReportRepo.remove(id, userId);
  await cloudinaryService.deleteAsset(existing.cloudinaryPublicId, existing.resourceType);

  return { deleted: true };
};

module.exports = {
  listReports,
  saveReport,
  deleteReport,
};
