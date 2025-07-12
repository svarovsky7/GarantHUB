-- ===============================================
-- БЫСТРАЯ ОПТИМИЗАЦИЯ ИНДЕКСОВ (БЕЗ CONCURRENTLY)
-- ===============================================
-- ВНИМАНИЕ: Этот скрипт может заблокировать таблицы!
-- Используйте только в непиковые часы или на dev/staging среде
-- ===============================================

-- ===============================================
-- ЭТАП 1: УДАЛЕНИЕ ИЗБЫТОЧНЫХ ИНДЕКСОВ
-- ===============================================

DROP INDEX IF EXISTS idx_claims_project;
DROP INDEX IF EXISTS idx_claims_status;
DROP INDEX IF EXISTS idx_defects_project;
DROP INDEX IF EXISTS idx_defects_status;
DROP INDEX IF EXISTS idx_defects_unit;
DROP INDEX IF EXISTS idx_court_cases_project;
DROP INDEX IF EXISTS idx_court_cases_status;
DROP INDEX IF EXISTS idx_letters_project;
DROP INDEX IF EXISTS idx_letters_type;
DROP INDEX IF EXISTS idx_units_project;

-- ===============================================
-- ЭТАП 2: КРИТИЧНО ВАЖНЫЕ ИНДЕКСЫ
-- ===============================================

-- COURT_CASES - самые критичные для дашборда
CREATE INDEX IF NOT EXISTS idx_court_cases_project_new ON court_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_court_cases_status_new ON court_cases(status);
CREATE INDEX IF NOT EXISTS idx_court_cases_project_status_new ON court_cases(project_id, status);
CREATE INDEX IF NOT EXISTS idx_court_cases_created_by ON court_cases(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_court_cases_responsible_lawyer ON court_cases(responsible_lawyer_id) WHERE responsible_lawyer_id IS NOT NULL;

-- CLAIMS - для пользовательской статистики
CREATE INDEX IF NOT EXISTS idx_claims_created_by ON claims(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_claims_engineer_id ON claims(engineer_id) WHERE engineer_id IS NOT NULL;

-- DEFECTS - для авторов
CREATE INDEX IF NOT EXISTS idx_defects_created_by ON defects(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_defects_status_id ON defects(status_id) WHERE status_id IS NOT NULL;

-- СВЯЗУЮЩИЕ ТАБЛИЦЫ - для загрузки файлов
CREATE INDEX IF NOT EXISTS idx_defect_attachments_defect_id ON defect_attachments(defect_id);
CREATE INDEX IF NOT EXISTS idx_claim_attachments_claim_id ON claim_attachments(claim_id);

-- ===============================================
-- ЭТАП 3: ОБНОВЛЕНИЕ СТАТИСТИКИ
-- ===============================================

ANALYZE claims;
ANALYZE defects; 
ANALYZE court_cases;
ANALYZE letters;
ANALYZE attachments;
ANALYZE claim_attachments;
ANALYZE defect_attachments;