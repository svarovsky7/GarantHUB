ALTER TABLE letters
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);
