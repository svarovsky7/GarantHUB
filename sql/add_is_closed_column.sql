-- Добавление колонки is_closed в таблицу tickets
ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS is_closed boolean NOT NULL DEFAULT false;
