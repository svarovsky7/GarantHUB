-- Добавление информации о пользователе и времени загрузки файлов
-- Создание новых колонок в таблице attachments
ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Создаём внешний ключ, чтобы created_by ссылался на profiles(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_name = 'attachments'
      AND constraint_name = 'attachments_created_by_fkey'
  ) THEN
    ALTER TABLE attachments
      ADD CONSTRAINT attachments_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;
END$$;
LANGUAGE plpgsql;

-- Для уже существующих записей сохраняем текущую дату, если поле не заполнено
UPDATE attachments
  SET created_at = COALESCE(created_at, uploaded_at)
  WHERE created_at IS NULL;
-- При желании можно заполнить created_by значением uploaded_by
UPDATE attachments
  SET created_by = uploaded_by
  WHERE created_by IS NULL;
