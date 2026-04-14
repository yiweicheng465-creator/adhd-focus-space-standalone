-- Run this once against your Neon database to create the users table.
-- psql $DATABASE_URL -f setup-db.sql

CREATE TABLE IF NOT EXISTS users (
  id               TEXT        PRIMARY KEY,           -- email address
  name             TEXT,                              -- display name (nullable)
  api_key_encrypted TEXT,                             -- AES-256-GCM encrypted OpenAI key
  api_key_iv       TEXT,                              -- base64 IV for decryption
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
