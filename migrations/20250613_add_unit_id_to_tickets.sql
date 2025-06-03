ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS unit_id integer REFERENCES units(id);
