-- Миграция переноса признака гарантийности
-- Добавить новый столбец в таблицу defects
ALTER TABLE defects
  ADD COLUMN IF NOT EXISTS is_warranty boolean NOT NULL DEFAULT false;

-- Копировать значение из tickets в связанные дефекты
UPDATE defects d
SET is_warranty = t.is_warranty
FROM tickets t
WHERE d.id = ANY(t.defect_ids);

-- Удалить старый столбец из tickets
ALTER TABLE tickets
  DROP COLUMN IF EXISTS is_warranty;
