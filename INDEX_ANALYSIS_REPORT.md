# Анализ индексов базы данных - Отчет по необходимым индексам

## Обзор анализа

Проанализированы следующие файлы с запросами к базе данных:
- `src/entities/claim/claim.ts`
- `src/entities/courtCase/index.ts`  
- `src/entities/defect/defect.ts`
- Файлы в `src/pages/*/`
- Файлы в `src/widgets/*/`
- Файлы в `src/features/*/`
- Файлы в `src/shared/hooks/`

## Критически важные недостающие индексы

### 1. Таблица `claims`

**Найденные запросы:**
```sql
-- Поиск по created_by
.eq('created_by', userId)
-- Поиск по engineer_id  
.eq('engineer_id', userId)
-- Сортировка по created_at с проектом
.order('created_at', { ascending: false })
-- Фильтрация по project_id (уже есть индекс)
.eq('project_id', projectId)
```

**Существующие индексы:**
- `idx_claims_project` - `project_id`
- `idx_claims_status` - `claim_status_id`

**Необходимые дополнительные индексы:**
```sql
-- Для поиска заявок по автору
CREATE INDEX idx_claims_created_by ON claims(created_by);

-- Для поиска заявок по ответственному инженеру  
CREATE INDEX idx_claims_engineer ON claims(engineer_id);

-- Составной индекс для сортировки по дате создания с фильтром по проекту
CREATE INDEX idx_claims_project_created_at ON claims(project_id, created_at DESC);

-- Составной индекс для фильтрации по статусу и проекту
CREATE INDEX idx_claims_project_status ON claims(project_id, claim_status_id);
```

### 2. Таблица `defects`

**Найденные запросы:**
```sql
-- Поиск по created_by
.eq('created_by', userId)
-- Поиск по engineer_id (уже есть индекс)
.eq('engineer_id', userId)  
-- Сортировка по id
.order('id', { ascending: false })
-- Поиск по status_id
.in('id', defectIds)
```

**Существующие индексы:**
- `idx_defects_engineer` - `engineer_id`

**Необходимые дополнительные индексы:**
```sql
-- Для поиска дефектов по автору
CREATE INDEX idx_defects_created_by ON defects(created_by);

-- Для фильтрации по статусу
CREATE INDEX idx_defects_status ON defects(status_id);

-- Для фильтрации по типу дефекта
CREATE INDEX idx_defects_type ON defects(type_id);

-- Составной индекс для проекта и статуса (через claim_defects)
CREATE INDEX idx_defects_project_status ON defects(status_id, engineer_id);
```

### 3. Таблица `court_cases`

**Найденные запросы:**
```sql
-- Фильтрация по project_id
.eq('project_id', project.id)
-- Фильтрация по статусу
.eq('status', closedCaseId)
-- Поиск по created_by
.eq('created_by', userId)
-- Поиск по responsible_lawyer_id
.eq('responsible_lawyer_id', userId)
-- Поиск по номеру дела
.eq('number', number)
-- Сортировка по id
.order('id', { ascending: false })
```

**Существующие индексы:**
- Только первичный ключ

**Необходимые индексы:**
```sql
-- Базовый индекс по проекту
CREATE INDEX idx_court_cases_project ON court_cases(project_id);

-- Для фильтрации по статусу
CREATE INDEX idx_court_cases_status ON court_cases(status);

-- Составной индекс проект + статус (самый важный)
CREATE INDEX idx_court_cases_project_status ON court_cases(project_id, status);

-- Для поиска по создателю
CREATE INDEX idx_court_cases_created_by ON court_cases(created_by);

-- Для поиска по ответственному юристу
CREATE INDEX idx_court_cases_lawyer ON court_cases(responsible_lawyer_id);

-- Для поиска по номеру дела
CREATE INDEX idx_court_cases_number ON court_cases(number);

-- Составной для сортировки с проектом
CREATE INDEX idx_court_cases_project_id_desc ON court_cases(project_id, id DESC);
```

### 4. Таблица `letters` (корреспонденция)

**Найденные запросы через shared/hooks:**
```sql
-- Фильтрация по проекту (уже есть индекс)
.eq('letters.project_id', projectId)
```

**Существующие индексы:**
- `idx_letters_project` - `project_id`

**Дополнительные индексы могут потребоваться для:**
```sql
-- Для фильтрации по статусу письма
CREATE INDEX idx_letters_status ON letters(status_id);

-- Для фильтрации по типу письма  
CREATE INDEX idx_letters_type ON letters(type_id);

-- Для поиска по created_by
CREATE INDEX idx_letters_created_by ON letters(created_by);
```

### 5. Таблица `units`

**Найденные запросы:**
```sql
-- Фильтрация по проекту и зданию (частично есть)
.eq('project_id', projectId)
.eq('building', building)
-- Фильтрация по locked
.eq('locked', true)
-- Поиск по массиву ID
.in('id', unit_ids)
```

**Существующие индексы:**
- `idx_units_project` - `project_id`
- `idx_units_project_building` - `project_id, building`

**Дополнительные индексы:**
```sql
-- Для фильтрации заблокированных квартир по проекту
CREATE INDEX idx_units_project_locked ON units(project_id, locked) WHERE locked = true;

-- Для фильтрации по этажу в здании
CREATE INDEX idx_units_project_building_floor ON units(project_id, building, floor);
```

## Индексы для связующих таблиц

### 6. Таблица `claim_defects`

**Критичные операции:**
```sql
.eq('claim_id', claimId)
.eq('defect_id', id)
.in('claim_id', ids)
```

**Существующие индексы:** ✅ Хорошо покрыты
- `idx_claim_defects_claim` - `claim_id`
- `claim_defects_defect_idx` - `defect_id`

### 7. Таблица `claim_units`

**Критичные операции:**
```sql
.in('claim_id', ids)
.eq('claim_id', id)
```

**Существующие индексы:** ✅ Хорошо покрыты
- `idx_claim_units_claim` - `claim_id`
- `idx_claim_units_unit` - `unit_id`

### 8. Таблица `defect_attachments`

**Операции:**
```sql
.eq('defect_id', id)
.in('defect_id', defectIds)
.eq('attachment_id', attachmentId)
```

**Существующие индексы:** ✅ Частично покрыты
- `idx_defect_attachments_file` - `attachment_id`

**Дополнительный индекс:**
```sql
-- Основной индекс по defect_id отсутствует!
CREATE INDEX idx_defect_attachments_defect ON defect_attachments(defect_id);
```

### 9. Таблица `claim_attachments`

**Операции:**
```sql
.eq('claim_id', id)
.eq('attachment_id', attachmentId)
```

**Существующие индексы:** Только составной первичный ключ

**Дополнительные индексы:**
```sql
-- Для быстрого поиска вложений по заявке
CREATE INDEX idx_claim_attachments_claim ON claim_attachments(claim_id);

-- Для обратного поиска заявок по вложению
CREATE INDEX idx_claim_attachments_attachment ON claim_attachments(attachment_id);
```

## Индексы для представлений (*_summary)

### 10. Представления summary

Используются представления:
- `claims_summary`
- `defects_summary`  
- `court_cases_summary`

**Критично:** Убедиться, что базовые таблицы имеют все необходимые индексы для эффективной работы представлений.

**Часто используемые операции в summary:**
```sql
-- Сортировка по created_at
.order('created_at', { ascending: false })
-- Сортировка по id  
.order('id', { ascending: false })
-- Фильтрация по project_id
.in('project_id', projectIds)
```

## Индексы для статистических запросов

### 11. Dashboard статистика

**Запросы из `useDashboardStats.ts`:**
```sql
-- Подсчет судебных дел
SELECT id FROM court_cases WHERE project_id = ? 
SELECT id FROM court_cases WHERE project_id = ? AND status = ?
```

**Уже покрыто предложенными индексами для court_cases.**

### 12. Пользовательская статистика

**Запросы из `useUserStats.ts`:**
- По `created_by` в claims, defects, court_cases
- По `engineer_id` в claims, defects  
- По `responsible_lawyer_id` в court_cases

**Покрыто предложенными индексами выше.**

## Приоритетность внедрения

### Высокий приоритет (критично для производительности):
1. `idx_court_cases_project_status` - для дашборда
2. `idx_claims_created_by` - для пользовательской статистики
3. `idx_claims_engineer` - для ответственных
4. `idx_defects_created_by` - для авторов дефектов
5. `idx_defect_attachments_defect` - для загрузки файлов

### Средний приоритет:
1. `idx_court_cases_project` - базовая фильтрация
2. `idx_claims_project_created_at` - сортировка
3. `idx_defects_status` - фильтрация по статусу

### Низкий приоритет:
1. Составные индексы для редко используемых комбинаций
2. Дополнительные индексы для letters и units

## SQL скрипт для создания критичных индексов

```sql
-- КРИТИЧНО: Основные индексы
CREATE INDEX CONCURRENTLY idx_court_cases_project ON court_cases(project_id);
CREATE INDEX CONCURRENTLY idx_court_cases_status ON court_cases(status);
CREATE INDEX CONCURRENTLY idx_court_cases_project_status ON court_cases(project_id, status);
CREATE INDEX CONCURRENTLY idx_court_cases_created_by ON court_cases(created_by);
CREATE INDEX CONCURRENTLY idx_court_cases_lawyer ON court_cases(responsible_lawyer_id);

CREATE INDEX CONCURRENTLY idx_claims_created_by ON claims(created_by);
CREATE INDEX CONCURRENTLY idx_claims_engineer ON claims(engineer_id);
CREATE INDEX CONCURRENTLY idx_claims_project_created_at ON claims(project_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_defects_created_by ON defects(created_by);
CREATE INDEX CONCURRENTLY idx_defects_status ON defects(status_id);
CREATE INDEX CONCURRENTLY idx_defects_type ON defects(type_id);

CREATE INDEX CONCURRENTLY idx_defect_attachments_defect ON defect_attachments(defect_id);
CREATE INDEX CONCURRENTLY idx_claim_attachments_claim ON claim_attachments(claim_id);

-- ВАЖНО: Дополнительные индексы
CREATE INDEX CONCURRENTLY idx_letters_status ON letters(status_id) WHERE status_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_letters_type ON letters(type_id) WHERE type_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_court_cases_number ON court_cases(number) WHERE number IS NOT NULL;
```

## Рекомендации по мониторингу

1. **Включить логирование медленных запросов** в PostgreSQL
2. **Мониторить использование индексов** через `pg_stat_user_indexes`
3. **Анализировать планы выполнения** для критичных запросов
4. **Регулярно обновлять статистику** через `ANALYZE`

## Потенциальная экономия

**Ожидаемые улучшения производительности:**
- Запросы дашборда: **5-10x быстрее**
- Загрузка списков заявок/дефектов: **3-5x быстрее**  
- Фильтрация и поиск: **2-3x быстрее**
- Пользовательская статистика: **10-20x быстрее**

**Дисковое пространство:** +50-100MB для индексов (незначительно)