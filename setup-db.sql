-- Run this once in Vercel → Storage → Neon → Query tab
-- Safe to run multiple times (uses IF NOT EXISTS / IF column does not exist)

CREATE TABLE IF NOT EXISTS users (
  id                TEXT        PRIMARY KEY,   -- email address
  name              TEXT,
  api_key_encrypted TEXT,
  api_key_iv        TEXT,
  ai_usage_count    INTEGER     DEFAULT 0,     -- free AI requests used (owner key)
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- If table already exists, add the column safely:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='ai_usage_count'
  ) THEN
    ALTER TABLE users ADD COLUMN ai_usage_count INTEGER DEFAULT 0;
  END IF;
END$$;
