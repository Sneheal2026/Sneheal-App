-- Family members for user health profiles
CREATE TABLE IF NOT EXISTS family_members (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    relationship ENUM('self', 'spouse', 'parent', 'child', 'sibling', 'other') NOT NULL DEFAULT 'other',
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
    age_years INT NULL,
    blood_group VARCHAR(10) NULL,
    allergies JSON NULL,
    conditions JSON NULL,
    current_medicines TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_family_members_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
