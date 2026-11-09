const AppError = require('../utils/AppError');

const rawBase = (process.env.DRUGSETU_BASE_URL || 'https://api.drugsetu.com').trim().replace(/\/+$/, '');
const BASE_URL = rawBase.endsWith('/v1') ? rawBase : `${rawBase}/v1`;

// In-memory cache for search results (10-minute TTL, max 500 entries)
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_SEARCH_CACHE_ENTRIES = 500;
const searchCache = new Map();

const getFromSearchCache = (key) => {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    searchCache.delete(key);
    return null;
  }
  return entry.data;
};

const saveToSearchCache = (key, data) => {
  if (searchCache.size >= MAX_SEARCH_CACHE_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(key, {
    data,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });
};

const isEnabled = () =>
  Boolean(process.env.DRUGSETU_API_KEY) && process.env.ENABLE_DRUGSETU !== 'false';

const getHeaders = () => ({
  'x-api-key': process.env.DRUGSETU_API_KEY,
  'Accept': 'application/json',
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options = {}, retries = 2, retryOn429 = true) => {
  const response = await fetch(url, options);
  if (response.status === 429) {
    if (retryOn429 && retries > 0) {
      console.warn(`[DrugSetu] Rate limited (429), retrying in 1200ms...`);
      await sleep(1200);
      return fetchWithRetry(url, options, retries - 1, retryOn429);
    }
    // Fail fast without sleeping when retryOn429 is false
    return response;
  }
  return response;
};

/**
 * Parses pipe-separated product_usage string into an array of clean indications.
 * e.g. "Hypertension [Treatment] | Heart failure [Treatment]" -> ["Hypertension", "Heart failure"]
 */
const parseUsage = (usageText) => {
  if (!usageText || typeof usageText !== 'string') return [];
  return usageText
    .split('|')
    .map((item) => item.replace(/\[.*?\]/g, '').trim())
    .filter(Boolean);
};

/**
 * Lightweight transform for DrugSetu search hits (typeahead).
 */
const transformSearchHit = (item) => {
  if (!item) return null;
  const productId = item.product_id;
  return {
    id: productId, // string drugsetu ID for route navigation
    drugsetuId: productId,
    name: item.product_name || 'Medicine',
    brandName: null,
    genericName: item.composition || null,
    manufacturer: item.marketing_company || 'Pharmaceuticals',
    distributorName: null,
    strength: null,
    form: item.product_type === 'drug' ? 'Medicine' : (item.product_type || 'Medicine'),
    imageUrl: null,
    images: [],
    price: 0,
    originalPrice: null,
    unit: '1 Pack',
    rating: 4.5,
    reviews: 0,
    uses: [],
    description: '',
    highlights: [],
    categoryId: null,
    prescriptionRequired: true,
    isFeatured: false,
    isActive: true,
    source: 'drugsetu',
  };
};

/**
 * Full transform for DrugSetu product details.
 */
const transformProductDetails = (raw) => {
  if (!raw) return null;

  const packaging = Array.isArray(raw.packagings) && raw.packagings.length > 0 ? raw.packagings[0] : {};
  const mrp = packaging.mrp != null ? Number(packaging.mrp) : 0;
  const rawImages = Array.isArray(raw.product_images) ? raw.product_images.filter(Boolean) : [];
  const primaryImage = rawImages[0] || null;

  const uses = parseUsage(raw.product_usage);
  if (raw.action_class && !uses.includes(raw.action_class)) {
    uses.push(raw.action_class);
  }

  const highlights = [
    { icon: 'shield-checkmark-outline', label: '100% Genuine' },
    { icon: 'flash-outline', label: 'Fast Delivery' },
  ];
  if (raw.chemical_class) {
    highlights.push({ icon: 'medical-outline', label: raw.chemical_class });
  }

  return {
    drugsetuId: raw.product_id,
    name: raw.product_name,
    brandName: null,
    genericName: raw.composition || null,
    manufacturer: raw.marketing_company || raw.manufacturing_company || 'Pharmaceuticals',
    distributorName: null,
    strength: null,
    form: packaging.product_form || 'Medicine',
    imageUrl: primaryImage,
    images: rawImages,
    price: mrp,
    originalPrice: mrp,
    unit: packaging.packaging || (packaging.package ? `${packaging.package} of ${packaging.qty || 1}` : '1 Pack'),
    rating: 4.6,
    reviews: 120,
    uses,
    description: raw.product_information || `${raw.product_name} is used as directed by your physician.`,
    highlights,
    categoryId: null,
    prescriptionRequired: true,
    isFeatured: false,
    isActive: true,
    source: 'drugsetu',
  };
};

/**
 * Calls DrugSetu Search API.
 * GET /v1/products/search?q={query}
 */
const searchProducts = async (query) => {
  if (!isEnabled()) return [];
  const term = String(query || '').trim();
  if (!term || term.length < 3) return [];

  const cacheKey = term.toLowerCase();
  const cached = getFromSearchCache(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `${BASE_URL}/products/search?q=${encodeURIComponent(term)}`;

  try {
    const controller = new AbortController();
    // 2.5-second timeout guard to prevent long hanging
    const timeout = setTimeout(() => controller.abort(), 2500);

    // retryOn429 = false, retries = 0: Fail fast on 429 so user immediately gets local results
    const response = await fetchWithRetry(
      url,
      {
        method: 'GET',
        headers: getHeaders(),
        signal: controller.signal,
      },
      0,
      false,
    );
    clearTimeout(timeout);

    if (response.status === 429) {
      console.warn(`[DrugSetu] Rate limited (429) for "${term}", immediately falling back to local database.`);
      return [];
    }

    if (!response.ok) {
      console.warn(`[DrugSetu] Search API returned ${response.status} for "${term}"`);
      return [];
    }

    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
    const results = items.map(transformSearchHit).filter(Boolean);

    // Cache non-empty search results for 10 minutes to save money & latency
    if (results.length > 0) {
      saveToSearchCache(cacheKey, results);
    }

    return results;
  } catch (error) {
    console.error(`[DrugSetu] Search API error for "${term}":`, error.message);
    return [];
  }
};

/**
 * Calls DrugSetu Product Details API.
 * GET /v1/products/:id
 */
const getProductById = async (drugsetId) => {
  if (!isEnabled()) return null;
  const id = String(drugsetId || '').trim();
  if (!id) return null;

  const url = `${BASE_URL}/products/${encodeURIComponent(id)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5-second timeout guard

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: getHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[DrugSetu] Details API returned ${response.status} for id "${id}"`);
      return null;
    }

    const payload = await response.json();
    const data = payload?.data ?? payload;
    return transformProductDetails(data);
  } catch (error) {
    console.error(`[DrugSetu] Details API error for "${id}":`, error.message);
    return null;
  }
};

module.exports = {
  isEnabled,
  searchProducts,
  getProductById,
};
