const cartService = require('../services/cart.service');
const { success } = require('../utils/response');

const quote = async (req, res) => {
  const data = await cartService.quoteCart(req.body?.items, req.body?.couponCode);
  return success(res, 'Cart quote ready', data);
};

const listPromotions = async (_req, res) => {
  const data = await cartService.listActivePromotions();
  return success(res, 'Promotions fetched', data);
};

module.exports = {
  quote,
  listPromotions,
};
