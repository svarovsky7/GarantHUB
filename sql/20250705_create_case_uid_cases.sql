-- SQL миграция: связывает уникальные идентификаторы с судебными делами
CREATE TABLE IF NOT EXISTS case_uid_cases (
  case_uid_id integer NOT NULL REFERENCES case_uids(id) ON DELETE CASCADE,
  court_case_id bigint NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
  PRIMARY KEY (case_uid_id, court_case_id)
);
