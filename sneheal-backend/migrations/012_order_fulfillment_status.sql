-- Fulfillment lifecycle: confirmed (pending delivery) → out_for_delivery → delivered

ALTER TABLE orders
  MODIFY status ENUM(
    'awaiting_payment',
    'confirmed',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ) NOT NULL DEFAULT 'awaiting_payment';

ALTER TABLE orders
  ADD COLUMN delivered_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;

ALTER TABLE orders
  ADD COLUMN assigned_agent_id BIGINT NULL DEFAULT NULL AFTER delivered_at;

ALTER TABLE orders
  ADD INDEX idx_orders_fulfillment (status, created_at);
