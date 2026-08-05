const db = require('../config/db');

const mapCategory = (row) => {
  if (!row) return null;

  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url ?? null,
    offerLabel: row.offer_label ?? null,
    sortOrder: Number(row.sort_order) || 0,
    isActive: Boolean(row.is_active),
  };
};

const findAllActive = async (connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, name, slug, image_url, offer_label, sort_order, is_active
     FROM categories
     WHERE is_active = 1
     ORDER BY sort_order ASC, name ASC`,
  );

  return rows.map(mapCategory);
};

const findById = async (id, connection = db) => {
  const [rows] = await connection.execute(
    `SELECT id, name, slug, image_url, offer_label, sort_order, is_active
     FROM categories
     WHERE id = ? AND is_active = 1
     LIMIT 1`,
    [id],
  );

  return mapCategory(rows[0]);
};

module.exports = {
  findAllActive,
  findById,
};
