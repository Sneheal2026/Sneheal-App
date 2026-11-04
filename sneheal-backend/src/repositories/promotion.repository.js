const db = require('../config/db');

const mapRow = (row) => ({
  id: String(row.id),
  code: row.code ? String(row.code) : null,
  title: String(row.title),
  subtitle: String(row.subtitle ?? ''),
  promoType: row.promo_type,
  value: Number(row.value),
  minCartPaise: Number(row.min_cart_paise),
  maxDiscountPaise:
    row.max_discount_paise == null ? null : Number(row.max_discount_paise),
  stackGroup: row.stack_group,
  priority: Number(row.priority),
  sortOrder: Number(row.sort_order),
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  isActive: Boolean(row.is_active),
});

const findActive = async () => {
  const [rows] = await db.execute(
    `SELECT id, code, title, subtitle, promo_type, value, min_cart_paise,
            max_discount_paise, stack_group, priority, sort_order,
            starts_at, ends_at, is_active
     FROM promotions
     WHERE is_active = 1
     ORDER BY sort_order ASC, priority DESC, id ASC`,
  );
  return rows.map(mapRow);
};

module.exports = {
  findActive,
};
