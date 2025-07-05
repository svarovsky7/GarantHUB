-- Переименование таблицы case_uids в court_cases_uids
ALTER TABLE case_uids RENAME TO court_cases_uids;
-- Переименование последовательности для id
ALTER SEQUENCE case_uids_id_seq RENAME TO court_cases_uids_id_seq;
-- Переименование ограничений первичного ключа и уникальности
ALTER INDEX case_uids_pkey RENAME TO court_cases_uids_pkey;
ALTER INDEX case_uids_uid_key RENAME TO court_cases_uids_uid_key;
