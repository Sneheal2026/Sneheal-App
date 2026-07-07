-- User delivery addresses (idempotent: skip if table already exists)
CREATE TABLE IF NOT EXISTS user_addresses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    address_line VARCHAR(500) NOT NULL,
    flat_number VARCHAR(100) NOT NULL,
    landmark VARCHAR(200) DEFAULT '',
    receiver_name VARCHAR(120) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    type ENUM('home', 'work', 'other') NOT NULL DEFAULT 'home',
    custom_label VARCHAR(50) DEFAULT '',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_addresses_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
