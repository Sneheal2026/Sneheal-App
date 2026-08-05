const db = require('../config/db');

const parseJsonField = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapProduct = (row) => {
  if (!row) return null;

  const originalPrice =
    row.original_price != null ? Number(row.original_price) : null;

  return {
    id: String(row.id),
    name: row.name,
    manufacturer: row.manufacturer,
    brandName: row.brand_name ?? null,
    genericName: row.generic_name ?? null,
    strength: row.strength ?? null,
    form: row.form ?? null,
    imageUrl: row.image_url ?? null,
    price: Number(row.price),
    originalPrice:
      originalPrice != null && !Number.isNaN(originalPrice)
        ? originalPrice
        : null,
    unit: row.unit,
    rating: Number(row.rating) || 0,
    reviews: Number(row.reviews) || 0,
    uses: parseJsonField(row.uses, []),
    description: row.description,
    highlights: parseJsonField(row.highlights, []),
    categoryId: row.category_id != null ? String(row.category_id) : null,
    prescriptionRequired: Boolean(row.prescription_required),
    isFeatured: Boolean(row.is_featured),
    isActive: Boolean(row.is_active),
  };
};

const PRODUCT_SELECT = `
  id, name, manufacturer, brand_name, generic_name, strength, form,
  image_url, price, original_price, unit, rating, reviews,
  uses, description, highlights, category_id,
  prescription_required, is_featured, is_active
`;

const clampInt = (value, fallback, min, max) => {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.min(Math.max(Math.trunc(num), min), max);
};

const buildPage = (items, total, limit, offset) => ({
  items,
  total,
  limit,
  offset,
  hasMore: offset + items.length < total,
});

const findMany = async (
  { featured, categoryId, limit = 20, offset = 0 } = {},
  connection = db,
) => {
  const clauses = ['is_active = 1'];
  const params = [];

  if (featured === true) {
    clauses.push('is_featured = 1');
  }

  if (categoryId != null && categoryId !== '') {
    clauses.push('category_id = ?');
    params.push(categoryId);
  }

  const whereSql = clauses.join(' AND ');
  const safeLimit = clampInt(limit, 20, 1, 50);
  const safeOffset = clampInt(offset, 0, 0, 1000000);

  const [countRows] = await connection.execute(
    `SELECT COUNT(*) AS total FROM products WHERE ${whereSql}`,
    params,
  );
  const total = Number(countRows[0]?.total) || 0;

  const [rows] = await connection.execute(
    `SELECT ${PRODUCT_SELECT}
     FROM products
     WHERE ${whereSql}
     ORDER BY is_featured DESC, rating DESC, name ASC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params,
  );

  return buildPage(rows.map(mapProduct), total, safeLimit, safeOffset);
};

const findById = async (id, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT ${PRODUCT_SELECT}
     FROM products
     WHERE id = ? AND is_active = 1
     LIMIT 1`,
    [id],
  );

  return mapProduct(rows[0]);
};

const search = async (query, { limit = 20, offset = 0 } = {}, connection = db) => {
  const term = String(query || '').trim();
  if (!term) {
    return buildPage([], 0, clampInt(limit, 20, 1, 50), clampInt(offset, 0, 0, 1000000));
  }

  const like = `%${term}%`;
  const safeLimit = clampInt(limit, 20, 1, 50);
  const safeOffset = clampInt(offset, 0, 0, 1000000);

  // Avoid CAST(uses AS CHAR) — too expensive at 5k+ rows.
  const whereSql = `
    is_active = 1
    AND (
      name LIKE ?
      OR manufacturer LIKE ?
      OR brand_name LIKE ?
      OR generic_name LIKE ?
    )
  `;
  const whereParams = [like, like, like, like];

  const [countRows] = await connection.execute(
    `SELECT COUNT(*) AS total FROM products WHERE ${whereSql}`,
    whereParams,
  );
  const total = Number(countRows[0]?.total) || 0;

  const [rows] = await connection.execute(
    `SELECT ${PRODUCT_SELECT}
     FROM products
     WHERE ${whereSql}
     ORDER BY
       CASE
         WHEN name LIKE ? THEN 0
         WHEN brand_name LIKE ? THEN 1
         WHEN generic_name LIKE ? THEN 2
         ELSE 3
       END,
       rating DESC,
       name ASC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [...whereParams, like, like, like],
  );

  return buildPage(rows.map(mapProduct), total, safeLimit, safeOffset);
};

const findSimilar = async (id, { limit = 6 } = {}, connection = db) => {
  const product = await findById(id, connection);
  if (!product) return [];

  const safeLimit = clampInt(limit, 6, 1, 20);

  if (product.categoryId) {
    const [rows] = await connection.execute(
      `SELECT ${PRODUCT_SELECT}
       FROM products
       WHERE is_active = 1 AND id <> ? AND category_id = ?
       ORDER BY rating DESC, reviews DESC
       LIMIT ${safeLimit}`,
      [id, product.categoryId],
    );

    if (rows.length > 0) {
      return rows.map(mapProduct);
    }
  }

  const [fallback] = await connection.execute(
    `SELECT ${PRODUCT_SELECT}
     FROM products
     WHERE is_active = 1 AND id <> ?
     ORDER BY is_featured DESC, rating DESC
     LIMIT ${safeLimit}`,
    [id],
  );

  return fallback.map(mapProduct);
};

module.exports = {
  findMany,
  findById,
  search,
  findSimilar,
};
