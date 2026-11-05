const db = require('../config/db');

const mapRow = (row) => ({
  imageType: String(row.image_type),
  imageUrl: String(row.image_url),
  aspectRatio: row.aspect_ratio == null ? null : Number(row.aspect_ratio),
  altText: String(row.alt_text ?? ''),
  sortOrder: Number(row.sort_order),
});

const findActive = async (now = new Date()) => {
  const [rows] = await db.execute(
    `SELECT image_type, image_url, aspect_ratio, alt_text, sort_order, updated_at
     FROM home_screen_images
     WHERE is_active = 1
       AND (starts_at IS NULL OR starts_at <= ?)
       AND (ends_at IS NULL OR ends_at >= ?)
     ORDER BY sort_order ASC, id ASC`,
    [now, now],
  );
  return rows;
};

module.exports = {
  findActive,
  mapRow,
};
