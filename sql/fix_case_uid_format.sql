-- Удалить кавычки и квадратные скобки из поля uid
UPDATE court_cases_uids
SET uid = regexp_replace(uid, '^\["(.+)"\]$', '\1')
WHERE uid ~ '^\[".*"\]$';

