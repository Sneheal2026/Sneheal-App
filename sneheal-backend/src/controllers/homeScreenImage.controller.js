const homeScreenImageService = require('../services/homeScreenImage.service');
const { success } = require('../utils/response');

const listHomeImages = async (_req, res) => {
  const data = await homeScreenImageService.listForHome();
  res.set('Cache-Control', 'public, max-age=300');
  return success(res, 'Home images fetched successfully', data);
};

module.exports = { listHomeImages };
