-- Migration: 021_user_public_id
-- Description: Add alphanumeric public_id to users for customer/patient identification

ALTER TABLE users ADD COLUMN public_id VARCHAR(24) NULL AFTER id;

UPDATE users SET public_id = CONCAT('SNH-U', LPAD(HEX(id), 6, '0')) WHERE public_id IS NULL OR public_id = '';

CREATE UNIQUE INDEX uq_users_public_id ON users (public_id);
