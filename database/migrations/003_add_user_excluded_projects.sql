-- Projects excluded from the weekly billing digest (client names from calendar)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS excluded_projects TEXT[] NOT NULL DEFAULT '{}';
