-- Добавление ответственного и объектов в письма
ALTER TABLE letters
    ADD COLUMN IF NOT EXISTS responsible_user_id uuid,
    ADD COLUMN IF NOT EXISTS unit_ids integer[] DEFAULT ARRAY[]::integer[];

CREATE INDEX IF NOT EXISTS letters_responsible_user_id_idx
    ON letters (responsible_user_id);
CREATE INDEX IF NOT EXISTS letters_unit_ids_idx
    ON letters USING GIN (unit_ids);
