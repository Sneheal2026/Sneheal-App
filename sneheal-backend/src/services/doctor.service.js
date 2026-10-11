const userRepo = require('../repositories/user.repository');
const orderRepo = require('../repositories/order.repository');
const prescriptionRepo = require('../repositories/prescription.repository');
const healthReportRepo = require('../repositories/healthReport.repository');
const cloudinaryService = require('./cloudinary.service');
const AppError = require('../utils/AppError');

const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

const maskPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  return `•••• ${digits.slice(-4)}`;
};

const getCustomer = async (userId) => {
  if (!/^\d{1,18}$/.test(String(userId || ''))) {
    throw new AppError(404, 'Customer not found');
  }

  const user = await userRepo.findById(userId);
  if (!user || user.role !== 'customer') {
    throw new AppError(404, 'Customer not found');
  }

  return {
    id: String(user.id),
    username: user.username || 'Customer',
    phone: user.phone || '',
    phoneMasked: maskPhone(user.phone),
  };
};

const searchCustomers = async (rawQuery) => {
  const query = String(rawQuery || '').trim();

  if (!query) {
    throw new AppError(400, 'Enter a name or user id');
  }

  if (query.length > 40) {
    throw new AppError(400, 'Search is too long');
  }

  if (/^\d{1,18}$/.test(query)) {
    return userRepo.searchCustomers({ id: query });
  }

  if (query.length < 2) {
    throw new AppError(400, 'Enter a user id, or at least 2 letters of the name');
  }

  return userRepo.searchCustomers({
    usernameLike: `%${escapeLike(query)}%`,
  });
};

const listCustomerOrders = async (userId) => {
  await getCustomer(userId);
  const orders = await orderRepo.findByUserId(userId);
  const items = await orderRepo.findItemsByOrderIds(orders.map((order) => order.id));
  const byOrder = new Map();

  for (const item of items) {
    const list = byOrder.get(item.orderId) || [];
    list.push(item);
    byOrder.set(item.orderId, list);
  }

  return orders.map((order) => ({
    id: order.id,
    publicId: order.publicId,
    status: order.status,
    createdAt: order.createdAt,
    items: (byOrder.get(order.id) || []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
    })),
  }));
};

const listCustomerPrescriptions = async (userId) => {
  await getCustomer(userId);
  return prescriptionRepo.findByUserId(userId);
};

const resolveReportFileUrl = (report) => {
  if (report.cloudinaryPublicId) {
    const signed = cloudinaryService.getSignedReportUrl(
      report.cloudinaryPublicId,
      report.resourceType,
    );
    if (signed) return signed;
  }
  return report.fileUrl;
};

const listCustomerReports = async (userId) => {
  await getCustomer(userId);
  const rows = await healthReportRepo.findByUserIdInternal(userId);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    fileUrl: resolveReportFileUrl(row),
    mimeType: row.mimeType,
    createdAt: row.createdAt,
  }));
};

const fetchRemoteReportBuffer = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError(502, `Could not fetch report file (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
};

const getCustomerReportFile = async (userId, reportId) => {
  await getCustomer(userId);
  const report = await healthReportRepo.findByIdAndUserId(reportId, userId);
  if (!report) {
    throw new AppError(404, 'Report not found');
  }

  const primaryUrl = resolveReportFileUrl(report);
  let buffer;
  try {
    buffer = await fetchRemoteReportBuffer(primaryUrl);
  } catch {
    if (primaryUrl !== report.fileUrl && report.fileUrl) {
      buffer = await fetchRemoteReportBuffer(report.fileUrl);
    } else {
      throw new AppError(502, 'Could not download report file');
    }
  }

  return {
    buffer,
    mimeType: report.mimeType || 'application/octet-stream',
    title: report.title || 'report',
  };
};

const listEngagedPatients = async () => userRepo.listEngagedPatients();

module.exports = {
  searchCustomers,
  listEngagedPatients,
  getCustomer,
  listCustomerOrders,
  listCustomerPrescriptions,
  listCustomerReports,
  getCustomerReportFile,
};
