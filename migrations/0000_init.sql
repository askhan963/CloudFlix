-- Track applied migrations
CREATE TABLE IF NOT EXISTS _migrations (
  id VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
