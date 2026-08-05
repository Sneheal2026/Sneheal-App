-- Product catalog: categories + products
-- image_url is nullable (client shows placeholders until real images are added)

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  image_url VARCHAR(500) NULL,
  offer_label VARCHAR(50) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255) NULL,
  generic_name VARCHAR(255) NULL,
  strength VARCHAR(50) NULL,
  form VARCHAR(50) NULL,
  image_url VARCHAR(500) NULL,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2) NULL,
  unit VARCHAR(100) NOT NULL,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
  reviews INT NOT NULL DEFAULT 0,
  uses JSON NOT NULL,
  description TEXT NOT NULL,
  highlights JSON NOT NULL,
  category_id BIGINT NULL,
  prescription_required TINYINT NOT NULL DEFAULT 0,
  is_featured TINYINT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_products_featured ON products (is_featured, is_active);
CREATE INDEX idx_products_category ON products (category_id, is_active);
CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_products_active ON products (is_active);
