const userRepo = require('../repositories/user.repository');
const orderRepo = require('../repositories/order.repository');
const prescriptionRepo = require('../repositories/prescription.repository');
const healthReportRepo = require('../repositories/healthReport.repository');
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

const listCustomerReports = async (userId) => {
  await getCustomer(userId);
  return healthReportRepo.findByUserId(userId);
};

const listEngagedPatients = async () => userRepo.listEngagedPatients();

module.exports = {
  searchCustomers,
  listEngagedPatients,
  getCustomer,
  listCustomerOrders,
  listCustomerPrescriptions,
  listCustomerReports,
};
