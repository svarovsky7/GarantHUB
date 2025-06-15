-- Добавление ссылки на пользователя, подтвердившего устранение
ALTER TABLE defects
  ADD COLUMN IF NOT EXISTS fixed_by uuid REFERENCES profiles(id);

-- Удаление устаревшего признака
ALTER TABLE defects
  DROP COLUMN IF EXISTS is_fixed;

-- Перевод в статус "НА ПРОВЕРКЕ" всех дефектов с указанным fixed_by
UPDATE defects
SET defect_status_id = (
  SELECT id FROM defect_statuses
  WHERE lower(name) LIKE '%провер%'
  LIMIT 1
)
WHERE fixed_by IS NOT NULL;
