-- 20250525_add_party_types_table.sql
-- Создание таблицы party_types и переход с enum на текстовый тип

CREATE TABLE party_types (
  id   BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT INTO party_types (name) VALUES
  ('CLAIMANT'),
  ('DEFENDANT'),
  ('THIRD');

-- Преобразуем колонку court_case_parties.party_type из ENUM в TEXT
ALTER TABLE court_case_parties
  ALTER COLUMN party_type TYPE TEXT USING party_type::text;

DROP TYPE IF EXISTS party_type;

ALTER TABLE court_case_parties
  ADD CONSTRAINT court_case_parties_party_type_fkey
    FOREIGN KEY (party_type) REFERENCES party_types(name);
