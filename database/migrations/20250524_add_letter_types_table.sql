-- 20250524_add_letter_types_table.sql
-- Создание таблицы letter_types и переход с enum на текстовый тип

CREATE TABLE letter_types (
  id   BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT INTO letter_types (name) VALUES
  ('PRETENSION'),
  ('CLAIM'),
  ('ANSWER'),
  ('NOTICE'),
  ('OTHER');

-- Преобразуем колонку letters.letter_type из ENUM в TEXT
ALTER TABLE letters
  ALTER COLUMN letter_type TYPE TEXT USING letter_type::text;

DROP TYPE IF EXISTS letter_type;

ALTER TABLE letters
  ADD CONSTRAINT letters_letter_type_fkey
    FOREIGN KEY (letter_type) REFERENCES letter_types(name);
