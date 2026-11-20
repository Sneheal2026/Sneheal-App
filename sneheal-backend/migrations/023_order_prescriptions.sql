-- Prescription integration for orders: links uploaded prescriptions and tracks pharmacist verification status

ALTER TABLE orders
  ADD COLUMN prescription_id BIGINT NULL AFTER address_id,
  ADD COLUMN prescription_url VARCHAR(500) NULL AFTER prescription_id,
  ADD COLUMN prescription_status ENUM('not_required', 'pending_verification', 'verified', 'rejected') NOT NULL DEFAULT 'not_required' AFTER prescription_url,
  ADD COLUMN prescription_rejected_reason VARCHAR(255) NULL AFTER prescription_status;

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_prescription
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
    ON DELETE SET NULL;

ALTER TABLE orders
  ADD INDEX idx_orders_prescription_status (prescription_status, created_at);
