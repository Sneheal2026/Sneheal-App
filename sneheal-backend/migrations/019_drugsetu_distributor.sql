-- DrugSetu & Distributor integration fields

ALTER TABLE products
  ADD COLUMN drugsetu_id VARCHAR(64) NULL AFTER id;


ALTER TABLE products
  ADD UNIQUE KEY uq_products_drugsetu_id (drugsetu_id);

ALTER TABLE products
  ADD COLUMN distributor_name VARCHAR(255) NULL AFTER manufacturer;

ALTER TABLE products
  ADD COLUMN images JSON NULL AFTER image_url;

ALTER TABLE products
  ADD COLUMN source ENUM('distributor', 'drugsetu') NOT NULL DEFAULT 'distributor' AFTER is_active;

