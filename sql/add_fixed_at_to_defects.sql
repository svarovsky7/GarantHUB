-- Add fixed_at column to defects table
ALTER TABLE defects ADD COLUMN IF NOT EXISTS fixed_at date;
