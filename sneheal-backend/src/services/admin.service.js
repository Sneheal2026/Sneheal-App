const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const adminRepo = require('../repositories/admin.repository');
const AppError = require('../utils/AppError');

/**
 * Sign an admin JWT token
 */
const signAdminToken = (admin) => {
  return jwt.sign(
    {
      sub: admin.id,
      username: admin.username,
      role: 'admin',
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

/**
 * Admin login verification
 */
const login = async (username, password) => {
  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  const admin = await adminRepo.findByUsername(username);
  if (!admin) {
    throw new AppError('Invalid admin credentials', 401);
  }

  if (!admin.isActive) {
    throw new AppError('Admin account is inactive. Please contact support.', 403);
  }

  const storedPassword = admin.password;
  let isMatch = false;

  const isBcrypt =
    storedPassword.startsWith('$2a$') ||
    storedPassword.startsWith('$2b$') ||
    storedPassword.startsWith('$2y$');

  if (isBcrypt) {
    isMatch = await bcrypt.compare(password, storedPassword);
  } else {
    // If entered directly into database as plaintext
    isMatch = storedPassword === password;
    // Automatically upgrade to bcrypt hash
    if (isMatch) {
      try {
        const hash = await bcrypt.hash(password, 10);
        await adminRepo.updatePasswordHash(admin.id, hash);
      } catch (_) {}
    }
  }

  if (!isMatch) {
    throw new AppError('Invalid admin credentials', 401);
  }

  await adminRepo.recordLoginSuccess(admin.id);

  const token = signAdminToken(admin);

  return {
    token,
    user: {
      id: admin.id,
      username: admin.username,
      role: 'admin',
    },
  };
};

/**
 * Retrieve system metrics
 */
const getOverviewStats = async () => {
  return await adminRepo.getOverviewStats();
};

/**
 * List doctors with optional filter & search
 */
const listDoctors = async (query = {}) => {
  const { status, search } = query;
  return await adminRepo.listDoctors({ status, search });
};

/**
 * Update doctor verification status
 */
const updateDoctorStatus = async (userId, status) => {
  if (!userId) {
    throw new AppError('Doctor ID is required', 400);
  }
  const valid = ['pending', 'approved', 'rejected'];
  if (!valid.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${valid.join(', ')}`, 400);
  }

  await adminRepo.updateDoctorVerificationStatus(userId, status);
  return { userId, verificationStatus: status };
};

/**
 * List delivery agents
 */
const listDeliveryAgents = async (query = {}) => {
  const { status, search } = query;
  return await adminRepo.listDeliveryAgents({ status, search });
};

/**
 * Retrieve delivery agent document
 */
const getDeliveryAgentDocument = async (userId, docType) => {
  if (!userId || !docType) {
    throw new AppError('User ID and document type are required', 400);
  }
  const cleanDoc = docType.toLowerCase().trim();
  if (cleanDoc !== 'aadhar' && cleanDoc !== 'license') {
    throw new AppError('Document type must be aadhar or license', 400);
  }

  const doc = await adminRepo.getDeliveryAgentDocument(userId, cleanDoc);
  if (!doc) {
    throw new AppError('Document not found for this delivery agent', 404);
  }
  return doc;
};

/**
 * Update delivery agent status
 */
const updateDeliveryAgentStatus = async (userId, status) => {
  if (!userId) {
    throw new AppError('Delivery agent ID is required', 400);
  }
  const valid = ['pending', 'approved', 'rejected'];
  if (!valid.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${valid.join(', ')}`, 400);
  }

  await adminRepo.updateDeliveryAgentVerificationStatus(userId, status);
  return { userId, verificationStatus: status };
};

/**
 * List orders with optional status & search filters
 */
const listOrders = async (query = {}) => {
  const { status, search } = query;
  return await adminRepo.listOrders({ status, search });
};

/**
 * Fetch detailed order breakdown with items & delivery agent info
 */
const getOrderDetails = async (orderId) => {
  if (!orderId) {
    throw new AppError('Order ID is required', 400);
  }
  const order = await adminRepo.getOrderDetails(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  return order;
};

/**
 * Update order fulfillment status
 */
const updateOrderStatus = async (orderId, status) => {
  if (!orderId || !status) {
    throw new AppError('Order ID and status are required', 400);
  }
  const valid = ['awaiting_payment', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!valid.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${valid.join(', ')}`, 400);
  }

  await adminRepo.updateOrderStatus(orderId, status);
  return { orderId, status };
};

const updateOrderPrescriptionStatus = async (orderId, status, reason = null) => {
  if (!orderId) {
    throw new AppError('Order ID is required', 400);
  }
  const valid = ['not_required', 'pending_verification', 'verified', 'rejected'];
  if (!valid.includes(status)) {
    throw new AppError(`Invalid prescription status. Must be one of: ${valid.join(', ')}`, 400);
  }

  await adminRepo.updateOrderPrescriptionStatus(orderId, status, reason);
  return { orderId, status, reason };
};

/**
 * List customer uploaded prescriptions
 */
const listPrescriptions = async (query = {}) => {
  const { search } = query;
  return await adminRepo.listPrescriptions({ search });
};

module.exports = {
  login,
  getOverviewStats,
  listDoctors,
  updateDoctorStatus,
  listDeliveryAgents,
  getDeliveryAgentDocument,
  updateDeliveryAgentStatus,
  listOrders,
  getOrderDetails,
  updateOrderStatus,
  updateOrderPrescriptionStatus,
  listPrescriptions,
};
