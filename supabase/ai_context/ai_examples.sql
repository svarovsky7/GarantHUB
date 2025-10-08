-- ============================================
-- AI CONTEXT: Примеры SQL операций
-- Автоматически сгенерировано: 2025-10-08T20:01:26.536Z
-- ============================================

-- Пример 1: Создание нового проекта
INSERT INTO projects (name, description, created_by)
VALUES ('ЖК Новая Москва', 'Жилой комплекс', auth.uid())
RETURNING id, name, created_at;

-- Пример 2: Создание объекта (unit) в проекте
INSERT INTO units (project_id, name, building, floor, type)
VALUES (1, 'Кв. 101', 'Корпус 1', 10, 'apartment')
RETURNING id, name, project_id;

-- Пример 3: Создание дефекта
INSERT INTO defects (
  project_id, unit_id, type_id, status_id, description,
  received_at, is_warranty, created_by
)
VALUES (
  1, 1, 1, 1, 'Трещина в стене',
  NOW(), true, auth.uid()
)
RETURNING id, description, created_at;

-- Пример 4: Создание претензии (claim)
INSERT INTO claims (
  project_id, claim_no, claim_status_id, description,
  claimed_on, engineer_id, created_by
)
VALUES (
  1, 'CLM-2025-001', 1, 'Претензия по дефектам',
  NOW(), auth.uid(), auth.uid()
)
RETURNING id, claim_no, created_at;

-- Пример 5: Связь претензии с дефектом
INSERT INTO claim_defects (claim_id, defect_id, pre_trial_claim)
VALUES (1, 1, false);

-- Пример 6: Связь претензии с объектом
INSERT INTO claim_units (claim_id, unit_id)
VALUES (1, 1);

-- Пример 7: Получение сводной информации о претензиях (оптимизированный запрос)
SELECT 
  id, claim_no, project_name, status_name, status_color,
  engineer_name, created_by_name,
  unit_ids, unit_names, building_names, -- агрегированные данные
  defect_ids, attachments_count
FROM claims_summary
WHERE project_id = 1
ORDER BY created_at DESC
LIMIT 50;

-- Пример 8: Получение сводной информации о дефектах (оптимизированный запрос)
SELECT 
  id, description, type_name, status_name, status_color,
  project_name, unit_name, unit_building,
  claim_ids, unit_ids, unit_names, building_names, -- агрегированные данные
  project_ids, project_names, has_pretrial_claim,
  received_at, fixed_at, engineer_name, attachments_count
FROM defects_summary
WHERE project_id = 1
ORDER BY id DESC
LIMIT 50;

-- Пример 9: Создание судебного дела
INSERT INTO court_cases (
  project_id, case_no, status_id, court_name,
  filing_date, total_claim_amount, created_by
)
VALUES (
  1, 'А40-123456/2025', 1, 'Арбитражный суд г. Москвы',
  NOW(), 500000.00, auth.uid()
)
RETURNING id, case_no, total_claim_amount;

-- Пример 10: Связь претензии с судебным делом (триггер пересчитает total_claim_amount)
INSERT INTO court_case_claims (court_case_id, claim_id, claim_amount)
VALUES (1, 1, 150000.00);
-- После выполнения триггер update_court_case_total_claim_amount
-- автоматически обновит court_cases.total_claim_amount

-- Пример 11: Обновление статуса претензии
UPDATE claims
SET claim_status_id = 2, resolved_on = NOW()
WHERE id = 1;

-- Пример 12: Получение профиля текущего пользователя
SELECT id, email, name, role, project_ids
FROM profiles
WHERE id = auth.uid();
