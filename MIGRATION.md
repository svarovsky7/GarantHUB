# Миграция базы данных

Ниже приведён пример SQL-кода, который обновляет существующую базу данных после добавления цвета для статусов и переименования таблицы стадий судебного дела.

```sql
-- Переименование таблицы стадий судебных дел
ALTER TABLE litigation_stages RENAME TO court_cases_statuses;

-- Переименование последовательности идентификаторов
ALTER SEQUENCE litigation_stages_id_seq RENAME TO court_cases_statuses_id_seq;

-- Обновление значения по умолчанию для id
ALTER TABLE court_cases_statuses
    ALTER COLUMN id SET DEFAULT nextval('court_cases_statuses_id_seq');

-- Добавление цвета к статусам дефектов
ALTER TABLE defect_statuses
    ADD COLUMN IF NOT EXISTS color varchar;

-- Добавление цвета к статусам судебных дел
ALTER TABLE court_cases_statuses
    ADD COLUMN IF NOT EXISTS color varchar;

-- Переопределение внешнего ключа на новую таблицу
ALTER TABLE court_cases
    DROP CONSTRAINT IF EXISTS court_cases_status_fkey,
    ADD CONSTRAINT court_cases_status_fkey
        FOREIGN KEY (status) REFERENCES court_cases_statuses(id);
```
