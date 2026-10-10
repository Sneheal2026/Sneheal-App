-- Customer lab reports and other health files (Cloudinary URL + metadata)
CREATE TABLE IF NOT EXISTS health_reports (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(120) NOT NULL,
  file_url VARCHAR(768) NOT NULL,
  cloudinary_public_id VARCHAR(255) NULL,
  resource_type VARCHAR(16) NOT NULL,
  mime_type VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_health_reports_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_health_reports_user_created
  ON health_reports (user_id, created_at DESC);
