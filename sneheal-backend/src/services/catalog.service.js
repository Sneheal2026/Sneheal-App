const productRepo = require('../repositories/product.repository');
const categoryRepo = require('../repositories/category.repository');
const drugsetuService = require('./drugsetu.service');
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
  const identifier = String(id || '').trim();
  if (!identifier) {
    throw new AppError(404, 'Product not found');
  }

  // 1. If it looks like a DrugSetu product ID (e.g. starts with "prod_")
  if (identifier.startsWith('prod_')) {
    // Check if already cached in MySQL with a valid non-zero price
    const cached = await productRepo.findByDrugSetuId(identifier);
    if (cached && Number(cached.price) > 0) {
      return cached;
    }

    // Fetch fresh data from DrugSetu API (or repair previously cached 0-rupee products)
    if (drugsetuService.isEnabled()) {
      const drugsetData = await drugsetuService.getProductById(identifier);
      if (drugsetData) {
        // Save/update MySQL so it has a valid price and local cache
        const saved = await productRepo.upsertDrugSetuProduct(drugsetData);
        return saved || drugsetData;
      }
    }

    if (cached) {
      return cached;
    }

    throw new AppError(404, 'Product not found');
  }

  // 2. Otherwise search MySQL by internal ID
  const product = await productRepo.findById(identifier);
  if (product) {
    // If it was previously cached from DrugSetu with ₹0 price, auto-repair it
    if (
      product.source === 'drugsetu' &&
      product.drugsetuId &&
      Number(product.price) <= 0 &&
      drugsetuService.isEnabled()
    ) {
      const drugsetData = await drugsetuService.getProductById(product.drugsetuId);
      if (drugsetData && Number(drugsetData.price) > 0) {
        const saved = await productRepo.upsertDrugSetuProduct(drugsetData);
        return saved || { ...product, ...drugsetData, id: product.id };
      }
    }
    return product;
  }

  // Fallback: check if an internal ID also matches a drugsetu_id
  if (drugsetuService.isEnabled()) {
    const cachedByDrugSetu = await productRepo.findByDrugSetuId(identifier);
    if (cachedByDrugSetu) return cachedByDrugSetu;
  }

  throw new AppError(404, 'Product not found');
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

  // 1. Call DrugSetu Search API first when enabled
  if (drugsetuService.isEnabled()) {
    const drugsetuResults = await drugsetuService.searchProducts(term);
    if (drugsetuResults.length > 0) {
      // Enrich with any products already cached in MySQL (so prices/images display immediately)
      const drugsetuIds = drugsetuResults.map((r) => r.drugsetuId).filter(Boolean);
      const cachedProducts = await productRepo.findByDrugSetuIds(drugsetuIds);
      const cachedMap = new Map(cachedProducts.map((p) => [p.drugsetuId, p]));

      const enrichedResults = drugsetuResults.map((item) => {
        const cached = cachedMap.get(item.drugsetuId);
        if (cached && Number(cached.price) > 0) {
          return {
            ...item,
            id: String(cached.id),
            price: Number(cached.price),
            originalPrice: Number(cached.originalPrice ?? cached.price),
            unit: cached.unit || item.unit,
            form: cached.form || item.form,
            imageUrl: cached.imageUrl || item.imageUrl,
            images: cached.images?.length > 0 ? cached.images : item.images,
          };
        }
        return item;
      });

      return {
        items: enrichedResults,
        total: enrichedResults.length,
        limit: queryParams.limit ? Number(queryParams.limit) : 20,
        offset: 0,
        hasMore: false,
      };
    }
  }

  // 2. If DrugSetu has no results (or disabled), fallback to local MySQL distributor products
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
