-- Удаляем связь с физлицом и добавляем поле владельца объекта
ALTER TABLE claims DROP COLUMN IF EXISTS person_id;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS owner text;
