-- Удаление колонки project_id из таблицы defects
ALTER TABLE defects DROP COLUMN IF EXISTS project_id;
