-- Добавление информации о пользователе и времени загрузки файлов
-- Создание новых колонок в таблице attachments
ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Для уже существующих записей сохраняем текущую дату, если поле не заполнено
UPDATE attachments
  SET created_at = COALESCE(created_at, uploaded_at)
  WHERE created_at IS NULL;
-- При желании можно заполнить created_by значением uploaded_by
UPDATE attachments
  SET created_by = uploaded_by
  WHERE created_by IS NULL;
