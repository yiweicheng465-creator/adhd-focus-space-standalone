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

-- Add Google Drive refresh token column (run once)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='google_refresh_token'
  ) THEN
    ALTER TABLE users ADD COLUMN google_refresh_token TEXT;
  END IF;
END$$;

-- Add onboarding tour completed flag (run once)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='tour_completed'
  ) THEN
    ALTER TABLE users ADD COLUMN tour_completed BOOLEAN DEFAULT FALSE;
  END IF;
END$$;
