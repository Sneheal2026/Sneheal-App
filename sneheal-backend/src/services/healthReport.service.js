const healthReportRepo = require('../repositories/healthReport.repository');
const cloudinaryService = require('./cloudinary.service');
const AppError = require('../utils/AppError');

const MAX_REPORTS = 40;

const normalizeReportMime = (mimetype, originalname) => {
  const mime = String(mimetype || '').trim().toLowerCase();
  const name = String(originalname || '').toLowerCase();
  if (mime === 'image/jpg') return 'image/jpeg';
  if (mime === 'application/pdf' || mime === 'application/x-pdf') return 'application/pdf';
  if (mime.startsWith('image/')) return mime;
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (mime === 'application/octet-stream' && name.endsWith('.pdf')) {
    return 'application/pdf';
  }
  return mime || 'application/pdf';
};

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

  const mimeType = normalizeReportMime(file.mimetype, file.originalname);
  const uploaded = await cloudinaryService.uploadHealthFile(file.buffer, mimeType);

  return healthReportRepo.create(userId, {
    title: cleanTitle(title, file.originalname),
    fileUrl: uploaded.fileUrl,
    cloudinaryPublicId: uploaded.publicId,
    resourceType: uploaded.resourceType,
    mimeType,
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
