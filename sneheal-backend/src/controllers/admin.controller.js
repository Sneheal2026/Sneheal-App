const adminService = require('../services/admin.service');
const { success } = require('../utils/response');

const login = async (req, res) => {
  const { username, password } = req.body;
  const result = await adminService.login(username, password);
  return success(res, 'Admin authentication successful', result);
};

const me = async (req, res) => {
  return success(res, 'Admin profile retrieved', {
    user: {
      id: req.user.sub,
      username: req.user.username,
      role: req.user.role,
    },
  });
};

const getOverviewStats = async (_req, res) => {
  const stats = await adminService.getOverviewStats();
  return success(res, 'Admin stats retrieved', stats);
};

const listDoctors = async (req, res) => {
  const doctors = await adminService.listDoctors(req.query);
  return success(res, 'Doctors retrieved successfully', doctors);
};

const updateDoctorStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;
  const result = await adminService.updateDoctorStatus(userId, status);
  return success(res, `Doctor verification status updated to ${status}`, result);
};

const listDeliveryAgents = async (req, res) => {
  const agents = await adminService.listDeliveryAgents(req.query);
  return success(res, 'Delivery agents retrieved successfully', agents);
};

const getDeliveryAgentDocument = async (req, res) => {
  const { userId, docType } = req.params;
  const document = await adminService.getDeliveryAgentDocument(userId, docType);
  return success(res, 'Document retrieved successfully', document);
};

const updateDeliveryAgentStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;
  const result = await adminService.updateDeliveryAgentStatus(userId, status);
  return success(res, `Delivery agent verification status updated to ${status}`, result);
};

const listOrders = async (req, res) => {
  const orders = await adminService.listOrders(req.query);
  return success(res, 'Orders retrieved successfully', orders);
};

const getOrderDetails = async (req, res) => {
  const { orderId } = req.params;
  const order = await adminService.getOrderDetails(orderId);
  return success(res, 'Order details retrieved successfully', order);
};

const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const result = await adminService.updateOrderStatus(orderId, status);
  return success(res, `Order status updated to ${status}`, result);
};

const listPrescriptions = async (req, res) => {
  const prescriptions = await adminService.listPrescriptions(req.query);
  return success(res, 'Prescriptions retrieved successfully', prescriptions);
};

module.exports = {
  login,
  me,
  getOverviewStats,
  listDoctors,
  updateDoctorStatus,
  listDeliveryAgents,
  getDeliveryAgentDocument,
  updateDeliveryAgentStatus,
  listOrders,
  getOrderDetails,
  updateOrderStatus,
  listPrescriptions,
};
