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
  const data = await orderService.getOrder(req.user.sub, req.params.id);
  return success(res, 'Order fetched successfully', data);
};

module.exports = {
  createOrder,
  listOrders,
  getOrder,
};
