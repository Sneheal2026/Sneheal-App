-- Remote CDN assets for Home festive UI (banner, border, header lantern & flower)

CREATE TABLE IF NOT EXISTS home_screen_images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  image_type VARCHAR(40) NOT NULL,
  image_url VARCHAR(512) NOT NULL,
  aspect_ratio DECIMAL(6, 3) NULL,
  alt_text VARCHAR(160) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_home_screen_images_type (image_type),
  INDEX idx_home_screen_images_active (is_active, sort_order)
);

INSERT IGNORE INTO home_screen_images (
  image_type, image_url, aspect_ratio, alt_text, sort_order, is_active
) VALUES
(
  'festive_banner',
  'https://res.cloudinary.com/toatd15x/image/upload/v1793880264/DiwaliBanner_bqrfef.webp',
  2.150,
  'Diwali Health Fest — flat 25 percent off on medicines',
  1,
  1
),
(
  'home_border',
  'https://res.cloudinary.com/toatd15x/image/upload/v1793880745/DiwaliBorder_nwdayg.webp',
  7.813,
  'Festive decorative border',
  2,
  1
),
(
  'header_lantern',
  'https://res.cloudinary.com/toatd15x/image/upload/v1793880888/LanternDesign_gd1nhd.webp',
  NULL,
  'Festive lantern decoration',
  3,
  1
),
(
  'header_flower',
  'https://res.cloudinary.com/toatd15x/image/upload/v1793881334/FlowerDesignn_er90up.webp',
  NULL,
  'Festive flower decoration',
  4,
  1
);
