-- In-app announcement inbox (Play Store updates, promos, etc.)

CREATE TABLE IF NOT EXISTS in_app_announcements (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  kind ENUM('app_update', 'general') NOT NULL DEFAULT 'general',
  title VARCHAR(120) NOT NULL,
  body VARCHAR(500) NOT NULL,
  target_android_version_code INT NULL,
  action_url VARCHAR(512) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_announcements_active (is_active, created_at),
  INDEX idx_announcements_kind (kind, is_active)
);

CREATE TABLE IF NOT EXISTS user_announcement_reads (
  user_id BIGINT NOT NULL,
  announcement_id BIGINT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, announcement_id),
  INDEX idx_announcement_reads_user (user_id),
  CONSTRAINT fk_uar_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_uar_announcement FOREIGN KEY (announcement_id) REFERENCES in_app_announcements(id) ON DELETE CASCADE
);
