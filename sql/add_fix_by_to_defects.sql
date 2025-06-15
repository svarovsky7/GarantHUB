-- Track performer responsible for fixing defect
ALTER TABLE defects ADD COLUMN IF NOT EXISTS fix_by text;
