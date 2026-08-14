-- Orders + Razorpay payments (idempotent: skip if tables already exist)

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  public_id VARCHAR(24) NOT NULL,
  user_id BIGINT NOT NULL,
  address_id BIGINT NULL,
  receiver_name VARCHAR(120) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  address_line VARCHAR(500) NOT NULL,
  flat_number VARCHAR(100) NOT NULL,
  landmark VARCHAR(200) NOT NULL DEFAULT '',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status ENUM('awaiting_payment', 'confirmed', 'cancelled') NOT NULL DEFAULT 'awaiting_payment',
  payment_status ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
  item_mrp_paise INT NOT NULL,
  item_selling_paise INT NOT NULL,
  discount_paise INT NOT NULL DEFAULT 0,
  promo_paise INT NOT NULL DEFAULT 0,
  handling_paise INT NOT NULL DEFAULT 0,
  delivery_paise INT NOT NULL DEFAULT 0,
  delivery_original_paise INT NOT NULL DEFAULT 0,
  gst_paise INT NOT NULL DEFAULT 0,
  grand_total_paise INT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  razorpay_order_id VARCHAR(40) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_orders_public_id (public_id),
  UNIQUE KEY uq_orders_razorpay_order_id (razorpay_order_id),
  INDEX idx_orders_user_created (user_id, created_at),
  INDEX idx_orders_user_pending (user_id, status, payment_status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES user_addresses(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NULL,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(100) NOT NULL,
  image_url VARCHAR(500) NULL,
  unit_price_paise INT NOT NULL,
  mrp_paise INT NOT NULL,
  quantity INT NOT NULL,
  line_total_paise INT NOT NULL,
  prescription_required TINYINT NOT NULL DEFAULT 0,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_order_items_order (order_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  provider VARCHAR(20) NOT NULL DEFAULT 'razorpay',
  razorpay_order_id VARCHAR(40) NOT NULL,
  razorpay_payment_id VARCHAR(40) NULL,
  razorpay_signature VARCHAR(128) NULL,
  amount_paise INT NOT NULL,
  method VARCHAR(40) NULL,
  status ENUM('created', 'authorized', 'captured', 'failed', 'refunded') NOT NULL DEFAULT 'created',
  raw_payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payments_payment_id (razorpay_payment_id),
  INDEX idx_payments_order (order_id),
  INDEX idx_payments_rzp_order (razorpay_order_id),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(80) NOT NULL,
  event VARCHAR(80) NOT NULL,
  payload JSON NOT NULL,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_webhook_event_id (event_id)
);
