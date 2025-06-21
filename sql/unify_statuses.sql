-- Унификация таблиц *_statuses в одну таблицу statuses
BEGIN;

CREATE TABLE IF NOT EXISTS public.statuses (
    id     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entity TEXT NOT NULL,
    name   TEXT NOT NULL,
    color  VARCHAR(7)
);

-- Перенос статусов тикетов
WITH ins AS (
    INSERT INTO public.statuses(entity, name, color)
    SELECT 'ticket', name, color FROM ticket_statuses
    RETURNING id, name
)
UPDATE tickets t
SET status_id = ins.id
FROM ticket_statuses s, ins
WHERE t.status_id = s.id AND s.name = ins.name;

-- Перенос статусов дефектов
WITH ins AS (
    INSERT INTO public.statuses(entity, name, color)
    SELECT 'defect', name, color FROM defect_statuses
    RETURNING id, name
)
UPDATE defects d
SET defect_status_id = ins.id
FROM defect_statuses s, ins
WHERE d.defect_status_id = s.id AND s.name = ins.name;

-- Перенос статусов претензий
WITH ins AS (
    INSERT INTO public.statuses(entity, name, color)
    SELECT 'claim', name, color FROM claim_statuses
    RETURNING id, name
)
UPDATE claims c
SET claim_status_id = ins.id
FROM claim_statuses s, ins
WHERE c.claim_status_id = s.id AND s.name = ins.name;

-- Перенос статусов писем
WITH ins AS (
    INSERT INTO public.statuses(entity, name, color)
    SELECT 'letter', name, color FROM letter_statuses
    RETURNING id, name
)
UPDATE letters l
SET status_id = ins.id
FROM letter_statuses s, ins
WHERE l.status_id = s.id AND s.name = ins.name;

-- Перенос стадий судебных дел
WITH ins AS (
    INSERT INTO public.statuses(entity, name, color)
    SELECT 'court_case', name, color FROM court_cases_statuses
    RETURNING id, name
)
UPDATE court_cases cc
SET status = ins.id
FROM court_cases_statuses s, ins
WHERE cc.status = s.id AND s.name = ins.name;

-- После переноса можно удалить старые справочники
DROP TABLE IF EXISTS ticket_statuses;
DROP TABLE IF EXISTS defect_statuses;
DROP TABLE IF EXISTS claim_statuses;
DROP TABLE IF EXISTS letter_statuses;
DROP TABLE IF EXISTS court_cases_statuses;

COMMIT;
