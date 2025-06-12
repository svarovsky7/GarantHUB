-- Добавляем уникальный идентификатор в таблицу связей писем
ALTER TABLE letter_links
  ADD COLUMN id BIGSERIAL;

ALTER TABLE letter_links
  ADD CONSTRAINT letter_links_id_key UNIQUE (id);
