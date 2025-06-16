-- Удаление устаревших текстовых колонок отправителя и получателя
ALTER TABLE letters
  DROP COLUMN IF EXISTS sender,
  DROP COLUMN IF EXISTS receiver;
