-- Optional override email for the weekly billing digest notification
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS digest_email TEXT NULL;
