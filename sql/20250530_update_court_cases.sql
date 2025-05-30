-- Обновление структуры таблицы court_cases
-- Удаляем устаревшие колонки и добавляем массивы объектов и вложений

-- Удаление полей comments и claim_amount
ALTER TABLE court_cases
    DROP COLUMN IF EXISTS comments,
    DROP COLUMN IF EXISTS claim_amount;

-- Поддержка нескольких объектов
ALTER TABLE court_cases
    ADD COLUMN IF NOT EXISTS unit_ids integer[] DEFAULT ARRAY[]::integer[];

UPDATE court_cases
    SET unit_ids = ARRAY[unit_id]
    WHERE unit_id IS NOT NULL
      AND (unit_ids IS NULL OR array_length(unit_ids, 1) IS NULL);

ALTER TABLE court_cases DROP COLUMN IF EXISTS unit_id;
CREATE INDEX IF NOT EXISTS court_cases_unit_ids_idx
    ON court_cases USING GIN (unit_ids);

-- Связь с таблицей attachments
ALTER TABLE court_cases
    ADD COLUMN IF NOT EXISTS attachment_ids integer[] DEFAULT ARRAY[]::integer[];
CREATE INDEX IF NOT EXISTS court_cases_attachment_ids_idx
    ON court_cases USING GIN (attachment_ids);
