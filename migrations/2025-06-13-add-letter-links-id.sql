-- Добавляем уникальный идентификатор в таблицу связей писем
ALTER TABLE letter_links
  ADD COLUMN id BIGSERIAL PRIMARY KEY;
