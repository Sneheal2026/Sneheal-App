const catalogService = require('../services/catalog.service');
const { success } = require('../utils/response');

const listCategories = async (_req, res) => {
  const categories = await catalogService.listCategories();
  return success(res, 'Categories fetched successfully', categories);
};

const listProducts = async (req, res) => {
  const products = await catalogService.listProducts(req.query);
  return success(res, 'Products fetched successfully', products);
};

const searchProducts = async (req, res) => {
  const products = await catalogService.searchProducts(req.query.q, req.query);
  return success(res, 'Products fetched successfully', products);
};

const getProduct = async (req, res) => {
  const product = await catalogService.getProduct(req.params.id);
  return success(res, 'Product fetched successfully', product);
};

const getSimilarProducts = async (req, res) => {
  const products = await catalogService.getSimilarProducts(req.params.id, req.query);
  return success(res, 'Similar products fetched successfully', products);
};

module.exports = {
  listCategories,
  listProducts,
  searchProducts,
  getProduct,
  getSimilarProducts,
};
