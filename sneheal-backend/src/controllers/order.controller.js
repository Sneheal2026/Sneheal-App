const orderService = require('../services/order.service');
const { success } = require('../utils/response');

const createOrder = async (req, res) => {
  const data = await orderService.createCheckoutOrder(req.user.sub, req.body);
  return success(res, 'Order placed successfully', data, 201);
};

const listOrders = async (req, res) => {
  const data = await orderService.listOrders(req.user.sub);
  return success(res, 'Orders fetched successfully', data);
};

const getOrder = async (req, res) => {
  const data = await orderService.getOrder(req.user, req.params.id);
  return success(res, 'Order fetched successfully', data);
};

const listDeliveryQueue = async (_req, res) => {
  const data = await orderService.listDeliveryQueue();
  return success(res, 'Delivery queue fetched successfully', data);
};

const updateStatus = async (req, res) => {
  const data = await orderService.updateFulfillmentStatus(
    req.user.sub,
    req.params.id,
    req.body?.status,
  );
  return success(res, 'Order status updated', data);
};

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  listDeliveryQueue,
  updateStatus,
};
