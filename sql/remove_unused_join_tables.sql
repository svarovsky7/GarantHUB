-- SQL скрипт для удаления неиспользуемых таблиц
-- Удаляем таблицы unit_persons и ticket_status_history, если они существуют

DROP TABLE IF EXISTS unit_persons CASCADE;
DROP TABLE IF EXISTS ticket_status_history CASCADE;
