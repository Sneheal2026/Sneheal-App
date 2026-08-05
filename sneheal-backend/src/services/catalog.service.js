const productRepo = require('../repositories/product.repository');
const categoryRepo = require('../repositories/category.repository');
const AppError = require('../utils/AppError');

const listCategories = async () => {
  return categoryRepo.findAllActive();
};

const listProducts = async (queryParams = {}) => {
  const featured =
    queryParams.featured === true ||
    queryParams.featured === 'true' ||
    queryParams.featured === '1';

  return productRepo.findMany({
    featured,
    categoryId: queryParams.categoryId,
    limit: queryParams.limit,
    offset: queryParams.offset,
  });
};

const getProduct = async (id) => {
  const product = await productRepo.findById(id);

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  return product;
};

const searchProducts = async (query, queryParams = {}) => {
  const term = String(query || '').trim();

  if (!term) {
    return {
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
      hasMore: false,
    };
  }

  return productRepo.search(term, {
    limit: queryParams.limit,
    offset: queryParams.offset,
  });
};

const getSimilarProducts = async (id, queryParams = {}) => {
  return productRepo.findSimilar(id, { limit: queryParams.limit });
};

module.exports = {
  listCategories,
  listProducts,
  getProduct,
  searchProducts,
  getSimilarProducts,
};
