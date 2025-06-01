ALTER TABLE court_cases
  ADD COLUMN IF NOT EXISTS is_closed boolean NOT NULL DEFAULT false;
