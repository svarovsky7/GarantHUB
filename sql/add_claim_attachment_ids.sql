ALTER TABLE claims
ADD COLUMN IF NOT EXISTS attachment_ids integer[] DEFAULT ARRAY[]::integer[];
