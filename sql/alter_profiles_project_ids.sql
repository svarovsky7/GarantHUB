ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS project_ids integer[] NOT NULL DEFAULT '{}';

-- Заполняем массив на основе project_id
UPDATE profiles SET project_ids = ARRAY[project_id] WHERE project_id IS NOT NULL AND (project_ids IS NULL OR project_ids = '{}');
