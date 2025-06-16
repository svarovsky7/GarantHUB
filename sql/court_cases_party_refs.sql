-- Добавление ссылок на контрагентов и физлиц в таблице court_cases
ALTER TABLE court_cases
  ADD COLUMN plaintiff_person_id BIGINT REFERENCES persons(id),
  ADD COLUMN plaintiff_contractor_id INTEGER REFERENCES contractors(id),
  ADD COLUMN defendant_person_id BIGINT REFERENCES persons(id),
  ADD COLUMN defendant_contractor_id INTEGER REFERENCES contractors(id);

-- Заполнение новых колонок на основании существующих данных
UPDATE court_cases cc
  SET plaintiff_person_id = p.id
  FROM persons p
  WHERE cc.plaintiff_id = p.id;
UPDATE court_cases cc
  SET plaintiff_contractor_id = c.id
  FROM contractors c
  WHERE cc.plaintiff_id = c.id;
UPDATE court_cases cc
  SET defendant_person_id = p.id
  FROM persons p
  WHERE cc.defendant_id = p.id;
UPDATE court_cases cc
  SET defendant_contractor_id = c.id
  FROM contractors c
  WHERE cc.defendant_id = c.id;

-- Удаление устаревших колонок
ALTER TABLE court_cases
  DROP COLUMN IF EXISTS plaintiff_id,
  DROP COLUMN IF EXISTS defendant_id;
