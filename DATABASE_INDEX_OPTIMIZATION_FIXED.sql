-- ===============================================
-- ОПТИМИЗАЦИЯ ИНДЕКСОВ БАЗЫ ДАННЫХ GARANTHUB
-- ===============================================
-- Дата: 2025-01-12
-- Автор: Claude Code Assistant
-- 
-- ВАЖНО: Этот скрипт нужно выполнять ПОЭТАПНО!
-- CREATE INDEX CONCURRENTLY нельзя выполнять в транзакции
-- 
-- Выполняйте каждый этап отдельно в psql или в GUI клиенте
-- ===============================================

-- ===============================================
-- ЭТАП 1: УДАЛЕНИЕ ИЗБЫТОЧНЫХ ИНДЕКСОВ
-- ===============================================
-- Выполните эти команды как одну транзакцию:

BEGIN;

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

COMMIT;

-- ===============================================
-- ЭТАП 2: КРИТИЧНО ВАЖНЫЕ ИНДЕКСЫ
-- ===============================================
-- Выполните каждую команду ОТДЕЛЬНО (не в транзакции):

-- COURT_CASES - самые критичные для дашборда
CREATE INDEX CONCURRENTLY idx_court_cases_project_new ON court_cases(project_id);

CREATE INDEX CONCURRENTLY idx_court_cases_status_new ON court_cases(status);

CREATE INDEX CONCURRENTLY idx_court_cases_project_status_new ON court_cases(project_id, status);

CREATE INDEX CONCURRENTLY idx_court_cases_created_by ON court_cases(created_by) WHERE created_by IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_court_cases_responsible_lawyer ON court_cases(responsible_lawyer_id) WHERE responsible_lawyer_id IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_court_cases_number ON court_cases(number) WHERE number IS NOT NULL;

-- CLAIMS - для пользовательской статистики и фильтрации
CREATE INDEX CONCURRENTLY idx_claims_created_by ON claims(created_by) WHERE created_by IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_claims_engineer_id ON claims(engineer_id) WHERE engineer_id IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_claims_project_created_desc ON claims(project_id, created_at DESC);

-- DEFECTS - для авторов и фильтрации
CREATE INDEX CONCURRENTLY idx_defects_created_by ON defects(created_by) WHERE created_by IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_defects_status_id ON defects(status_id) WHERE status_id IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_defects_type_id ON defects(type_id) WHERE type_id IS NOT NULL;

-- СВЯЗУЮЩИЕ ТАБЛИЦЫ - критично важные для загрузки файлов
CREATE INDEX CONCURRENTLY idx_defect_attachments_defect_id ON defect_attachments(defect_id);

CREATE INDEX CONCURRENTLY idx_claim_attachments_claim_id ON claim_attachments(claim_id);

-- COURT_CASE связующие таблицы
CREATE INDEX CONCURRENTLY idx_court_case_attachments_case ON court_case_attachments(court_case_id);

CREATE INDEX CONCURRENTLY idx_court_case_attachments_attachment ON court_case_attachments(attachment_id);

-- ===============================================
-- ЭТАП 3: ДОПОЛНИТЕЛЬНЫЕ ИНДЕКСЫ
-- ===============================================
-- Выполните каждую команду ОТДЕЛЬНО:

-- LETTERS - дополнительные индексы для фильтрации
CREATE INDEX CONCURRENTLY idx_letters_status_id ON letters(status_id) WHERE status_id IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_letters_created_by ON letters(created_by) WHERE created_by IS NOT NULL;

-- Для дашборда - составные индексы для быстрой статистики
CREATE INDEX CONCURRENTLY idx_court_cases_project_date_status ON court_cases(project_id, created_at DESC, status);

-- Для пользовательской статистики - составные индексы
CREATE INDEX CONCURRENTLY idx_claims_engineer_project ON claims(engineer_id, project_id) WHERE engineer_id IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_defects_engineer_project ON defects(engineer_id, project_id) WHERE engineer_id IS NOT NULL;

-- ===============================================
-- ЭТАП 4: ИНДЕКСЫ ДЛЯ ПРЕДСТАВЛЕНИЙ
-- ===============================================
-- Выполните каждую команду ОТДЕЛЬНО:

-- Для статусов (используется во всех summary)
CREATE INDEX CONCURRENTLY idx_statuses_entity_id_new ON statuses(entity, id);

-- Для профилей (используется в summary для имен пользователей)  
CREATE INDEX CONCURRENTLY idx_profiles_id_name_email ON profiles(id, name, email);

-- Для проектов (используется во всех summary)
CREATE INDEX CONCURRENTLY idx_projects_id_name ON projects(id, name);

-- ===============================================
-- ЭТАП 5: ОБНОВЛЕНИЕ СТАТИСТИКИ
-- ===============================================
-- Выполните как одну транзакцию:

BEGIN;
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
COMMIT;