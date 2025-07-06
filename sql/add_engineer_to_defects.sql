-- Добавление колонки engineer_id в таблицу defects
ALTER TABLE IF EXISTS defects
  ADD COLUMN IF NOT EXISTS engineer_id uuid REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_defects_engineer ON defects(engineer_id);
