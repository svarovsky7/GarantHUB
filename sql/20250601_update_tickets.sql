-- Обновление структуры таблицы tickets для поддержки нескольких объектов
ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS unit_ids integer[] DEFAULT ARRAY[]::integer[];

UPDATE tickets
    SET unit_ids = ARRAY[unit_id]
    WHERE unit_id IS NOT NULL
      AND (unit_ids IS NULL OR array_length(unit_ids, 1) IS NULL);

ALTER TABLE tickets DROP COLUMN IF EXISTS unit_id;

CREATE INDEX IF NOT EXISTS tickets_unit_ids_idx
    ON tickets USING GIN (unit_ids);
