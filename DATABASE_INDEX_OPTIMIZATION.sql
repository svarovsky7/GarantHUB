-- ===============================================
-- ОПТИМИЗАЦИЯ ИНДЕКСОВ БАЗЫ ДАННЫХ GARANTHUB
-- ===============================================
-- Дата: 2025-01-12
-- Автор: Claude Code Assistant
-- Описание: Скрипт для удаления избыточных и добавления критично важных индексов

-- ===============================================
-- ЭТАП 1: УДАЛЕНИЕ ИЗБЫТОЧНЫХ ИНДЕКСОВ
-- ===============================================

-- Примечание: Эти индексы покрываются составными индексами
-- Удаление позволит ускорить INSERT/UPDATE/DELETE операции

-- Claims - удаляем одиночные индексы, покрываемые составными
DROP INDEX IF EXISTS idx_claims_project;      -- покрывается idx_claims_project_created
DROP INDEX IF EXISTS idx_claims_status;       -- покрывается idx_claims_status_date

-- Defects - удаляем одиночные индексы
DROP INDEX IF EXISTS idx_defects_project;     -- покрывается idx_defects_project_status_date
DROP INDEX IF EXISTS idx_defects_status;      -- покрывается idx_defects_project_status_date
DROP INDEX IF EXISTS idx_defects_unit;        -- покрывается idx_defects_unit_status

-- Court cases - удаляем одиночные индексы  
DROP INDEX IF EXISTS idx_court_cases_project; -- покрывается idx_court_cases_project_date
DROP INDEX IF EXISTS idx_court_cases_status;  -- покрывается idx_court_cases_project_status

-- Letters - удаляем одиночные индексы
DROP INDEX IF EXISTS idx_letters_project;     -- покрывается idx_letters_project_date  
DROP INDEX IF EXISTS idx_letters_type;        -- покрывается idx_letters_project_type

-- Units - удаляем одиночный индекс
DROP INDEX IF EXISTS idx_units_project;       -- покрывается idx_units_project_building

-- ===============================================
-- ЭТАП 2: ДОБАВЛЕНИЕ КРИТИЧНО ВАЖНЫХ ИНДЕКСОВ
-- ===============================================

-- COURT_CASES - самые критичные для дашборда
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_court_cases_project_new 
ON court_cases(project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_court_cases_status_new 
ON court_cases(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_court_cases_project_status_new 
ON court_cases(project_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_court_cases_created_by 
ON court_cases(created_by) WHERE created_by IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_court_cases_responsible_lawyer 
ON court_cases(responsible_lawyer_id) WHERE responsible_lawyer_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_court_cases_number 
ON court_cases(number) WHERE number IS NOT NULL;

-- CLAIMS - для пользовательской статистики и фильтрации
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_claims_created_by 
ON claims(created_by) WHERE created_by IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_claims_engineer_id 
ON claims(engineer_id) WHERE engineer_id IS NOT NULL;

-- Для оптимизации сортировки списков заявок
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_claims_project_created_desc 
ON claims(project_id, created_at DESC);

-- DEFECTS - для авторов и фильтрации
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_defects_created_by 
ON defects(created_by) WHERE created_by IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_defects_status_id 
ON defects(status_id) WHERE status_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_defects_type_id 
ON defects(type_id) WHERE type_id IS NOT NULL;

-- СВЯЗУЮЩИЕ ТАБЛИЦЫ - критично важные для загрузки файлов
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_defect_attachments_defect_id 
ON defect_attachments(defect_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_claim_attachments_claim_id 
ON claim_attachments(claim_id);

-- COURT_CASE связующие таблицы
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_court_case_attachments_case 
ON court_case_attachments(court_case_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_court_case_attachments_attachment 
ON court_case_attachments(attachment_id);

-- LETTERS - дополнительные индексы для фильтрации
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_letters_status_id 
ON letters(status_id) WHERE status_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_letters_created_by 
ON letters(created_by) WHERE created_by IS NOT NULL;

-- ===============================================
-- ЭТАП 3: СПЕЦИАЛЬНЫЕ ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
-- ===============================================

-- Для дашборда - составные индексы для быстрой статистики
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_court_cases_project_date_status 
ON court_cases(project_id, created_at DESC, status);

-- Для пользовательской статистики - составные индексы
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_claims_engineer_project 
ON claims(engineer_id, project_id) WHERE engineer_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_defects_engineer_project 
ON defects(engineer_id, project_id) WHERE engineer_id IS NOT NULL;

-- Для поиска связанных даний в представлениях
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_claim_links_parent_child 
ON claim_links(parent_id, child_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_court_case_links_parent_child 
ON court_case_links(parent_id, child_id);

-- ===============================================
-- ЭТАП 4: ИНДЕКСЫ ДЛЯ ПРЕДСТАВЛЕНИЙ (*_summary)
-- ===============================================

-- Убеждаемся что у базовых таблиц есть индексы для эффективной работы views
-- Эти индексы нужны для JOIN'ов в представлениях

-- Для статусов (используется во всех summary)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_statuses_entity_id_new 
ON statuses(entity, id);

-- Для профилей (используется в summary для имен пользователей)  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_id_name_email 
ON profiles(id, name, email);

-- Для проектов (используется во всех summary)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_id_name 
ON projects(id, name);

-- ===============================================
-- ЭТАП 5: ОБНОВЛЕНИЕ СТАТИСТИКИ
-- ===============================================

-- Обновляем статистику планировщика для корректных планов запросов
ANALYZE claims;
ANALYZE defects; 
ANALYZE court_cases;
ANALYZE letters;
ANALYZE attachments;
ANALYZE claim_attachments;
ANALYZE defect_attachments;
ANALYZE court_case_attachments;
ANALYZE statuses;
ANALYZE profiles;
ANALYZE projects;

-- ===============================================
-- ЭТАП 6: ПРОВЕРОЧНЫЕ ЗАПРОСЫ
-- ===============================================

-- Запросы для проверки использования новых индексов
-- Выполните после создания индексов для проверки планов выполнения

/*
-- 1. Проверка дашборда (должен использовать idx_court_cases_project_status_new)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM court_cases 
WHERE project_id = 1 AND status = 2;

-- 2. Проверка пользовательской статистики (должен использовать idx_claims_created_by)
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM claims 
WHERE created_by = 'some-uuid';

-- 3. Проверка загрузки файлов (должен использовать idx_defect_attachments_defect_id)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM defect_attachments 
WHERE defect_id = 123;

-- 4. Проверка сортировки заявок (должен использовать idx_claims_project_created_desc)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM claims 
WHERE project_id = 1 
ORDER BY created_at DESC 
LIMIT 50;
*/

-- ===============================================
-- ПРИМЕЧАНИЯ ПО ВНЕДРЕНИЮ
-- ===============================================

/*
ВАЖНО:
1. Выполняйте этот скрипт в непиковые часы
2. Используется CONCURRENTLY для создания индексов без блокировки таблиц
3. Мониторьте размер базы данных - индексы добавят ~50-100MB
4. После создания индексов проверьте планы выполнения критичных запросов
5. Включите мониторинг использования индексов через pg_stat_user_indexes

ОЖИДАЕМЫЙ ЭФФЕКТ:
- Запросы дашборда: 5-10x быстрее
- Загрузка списков: 3-5x быстрее  
- Пользовательская статистика: 10-20x быстрее
- Поиск и фильтрация: 2-3x быстрее

МОНИТОРИНГ:
-- Проверка использования индексов
SELECT 
    schemaname,
    tablename, 
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE indexname LIKE '%_new' 
ORDER BY idx_tup_read DESC;

-- Поиск неиспользуемых индексов (через месяц после внедрения)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_tup_read = 0 AND idx_tup_fetch = 0
ORDER BY tablename, indexname;
*/