-- Videos with soft-delete & visibility
CREATE TABLE IF NOT EXISTS videos (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  genre VARCHAR(100) NULL,
  producer VARCHAR(100) NULL,
  age_rating VARCHAR(10) NULL,
  visibility ENUM('public','unlisted','private') NOT NULL DEFAULT 'public',
  duration_s INT NULL,
  size_bytes BIGINT NULL,
  uploader_id BIGINT NOT NULL,
  blob_name VARCHAR(512) NOT NULL,
  blob_url VARCHAR(1024) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_visibility (visibility),
  INDEX idx_uploader (uploader_id),
  INDEX idx_created (created_at),
  FULLTEXT KEY ftx_title_desc (title, description),
  CONSTRAINT fk_videos_user FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);
