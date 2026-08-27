CREATE TABLE IF NOT EXISTS gallery_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  sharing_enabled INTEGER NOT NULL DEFAULT 1,
  retention_days INTEGER NOT NULL DEFAULT 30,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gallery_photos (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES gallery_events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gallery_photos_event_created
ON gallery_photos(event_id, created_at DESC);
