-- Миграция для поддержки нескольких истцов и ответчиков

-- Добавляем колонку role и создаём таблицу при необходимости
CREATE TABLE IF NOT EXISTS court_case_parties (
  id BIGSERIAL PRIMARY KEY,
  case_id BIGINT NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('plaintiff','defendant')),
  person_id BIGINT REFERENCES persons(id),
  contractor_id INTEGER REFERENCES contractors(id),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Если таблица уже существовала, убеждаемся что колонка role присутствует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='court_case_parties' AND column_name='role'
  ) THEN
    ALTER TABLE court_case_parties ADD COLUMN role TEXT;
    ALTER TABLE court_case_parties
      ALTER COLUMN role SET NOT NULL,
      ADD CONSTRAINT court_case_parties_role_chk CHECK (role IN ('plaintiff','defendant'));
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Переносим данные из старых колонок
INSERT INTO court_case_parties(case_id, role, person_id, contractor_id, project_id)
SELECT id, 'plaintiff', plaintiff_person_id, plaintiff_contractor_id, project_id
FROM court_cases
WHERE plaintiff_person_id IS NOT NULL OR plaintiff_contractor_id IS NOT NULL;

INSERT INTO court_case_parties(case_id, role, person_id, contractor_id, project_id)
SELECT id, 'defendant', defendant_person_id, defendant_contractor_id, project_id
FROM court_cases
WHERE defendant_person_id IS NOT NULL OR defendant_contractor_id IS NOT NULL;

-- Удаляем старые колонки
ALTER TABLE court_cases
  DROP COLUMN IF EXISTS plaintiff_person_id,
  DROP COLUMN IF EXISTS plaintiff_contractor_id,
  DROP COLUMN IF EXISTS defendant_person_id,
  DROP COLUMN IF EXISTS defendant_contractor_id;
