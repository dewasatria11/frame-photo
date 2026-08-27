CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config_json TEXT NOT NULL,
  asset_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS processing_history (
  id TEXT PRIMARY KEY,
  source_filename TEXT NOT NULL,
  output_filename TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  settings_json TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_processing_history_created_at
ON processing_history(created_at DESC);
