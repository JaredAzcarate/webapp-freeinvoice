-- Add hourly rate and Google OAuth tokens to users for calendar digest billing
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT NULL,
  ADD COLUMN IF NOT EXISTS google_access_token TEXT NULL,
  ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ NULL;
