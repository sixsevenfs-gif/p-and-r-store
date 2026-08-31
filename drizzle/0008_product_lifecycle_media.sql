-- Add recoverable product lifecycle and media-library metadata without changing existing records.
ALTER TABLE products ADD COLUMN hidden_at INTEGER;
ALTER TABLE products ADD COLUMN hidden_reason TEXT;
ALTER TABLE products ADD COLUMN hidden_by TEXT;
ALTER TABLE products ADD COLUMN archived_at INTEGER;
ALTER TABLE products ADD COLUMN archived_reason TEXT;
ALTER TABLE products ADD COLUMN archived_by TEXT;
ALTER TABLE products ADD COLUMN deleted_at INTEGER;

ALTER TABLE media_assets ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
ALTER TABLE media_assets ADD COLUMN category TEXT NOT NULL DEFAULT 'product';
ALTER TABLE media_assets ADD COLUMN trashed_at INTEGER;
ALTER TABLE media_assets ADD COLUMN uploaded_by TEXT;
