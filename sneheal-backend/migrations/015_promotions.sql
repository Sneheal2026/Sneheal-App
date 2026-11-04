-- Promotions / coupons (cart stack vs delivery stack)

CREATE TABLE IF NOT EXISTS promotions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(32) NULL,
  title VARCHAR(120) NOT NULL,
  subtitle VARCHAR(255) NOT NULL DEFAULT '',
  promo_type ENUM('percent_off', 'flat_off', 'free_delivery') NOT NULL,
  value INT NOT NULL DEFAULT 0,
  min_cart_paise INT NOT NULL DEFAULT 0,
  max_discount_paise INT NULL,
  stack_group ENUM('cart', 'delivery') NOT NULL,
  priority INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_promotions_code (code),
  INDEX idx_promotions_active (is_active, stack_group, sort_order)
);

INSERT IGNORE INTO promotions (
  code, title, subtitle, promo_type, value, min_cart_paise, max_discount_paise,
  stack_group, priority, sort_order, starts_at, ends_at, is_active
) VALUES
(
  'DIWALI25',
  'Diwali special',
  '25% off on medicine orders above ₹200',
  'percent_off',
  25,
  20000,
  15000,
  'cart',
  20,
  1,
  '2026-10-01 00:00:00',
  '2026-12-31 23:59:59',
  1
),
(
  NULL,
  'Free delivery',
  'No delivery fee on orders above ₹100',
  'free_delivery',
  0,
  10000,
  NULL,
  'delivery',
  5,
  2,
  NULL,
  NULL,
  1
);
