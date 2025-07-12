# Пошаговая инструкция по оптимизации индексов

## Проблема с CONCURRENTLY

Ошибка `CREATE INDEX CONCURRENTLY cannot run inside a transaction block` возникает потому, что:
- `CREATE INDEX CONCURRENTLY` требует автокоммит режима
- Нельзя выполнять в транзакции (`BEGIN...COMMIT`)
- Нужно выполнять каждую команду отдельно

## Варианты решения

### 🟢 **Вариант 1: Безопасный (рекомендуемый для PROD)**

Используйте файл `DATABASE_INDEX_OPTIMIZATION_FIXED.sql`

**Выполняйте поэтапно:**

#### Этап 1: Удаление избыточных индексов
```sql
-- Выполните весь блок как одну транзакцию
BEGIN;
DROP INDEX IF EXISTS idx_claims_project;
DROP INDEX IF EXISTS idx_claims_status;
-- ... остальные DROP INDEX
COMMIT;
```

#### Этап 2: Создание критичных индексов  
**Выполняйте каждую команду ОТДЕЛЬНО:**
```sql
-- Команда 1 (выполнить и дождаться завершения)
CREATE INDEX CONCURRENTLY idx_court_cases_project_new ON court_cases(project_id);

-- Команда 2 (выполнить и дождаться завершения)  
CREATE INDEX CONCURRENTLY idx_court_cases_status_new ON court_cases(status);

-- И так далее...
```

### 🟡 **Вариант 2: Быстрый (для DEV/STAGING)**

Используйте файл `DATABASE_INDEX_OPTIMIZATION_SIMPLE.sql`

**Один скрипт без CONCURRENTLY:**
- Заблокирует таблицы на время создания индексов
- Выполняется быстрее
- Подходит для непиковых часов

## Проверка результатов

После создания индексов проверьте их использование:

```sql
-- Проверка созданных индексов
SELECT 
    schemaname,
    tablename, 
    indexname,
    indexdef
FROM pg_indexes 
WHERE indexname LIKE '%_new' OR indexname LIKE '%created_by%'
ORDER BY tablename, indexname;

-- Проверка планов выполнения
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM court_cases 
WHERE project_id = 1 AND status = 2;
```

## Мониторинг использования

Через неделю после создания проверьте статистику:

```sql
SELECT 
    schemaname,
    tablename, 
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE indexname LIKE '%_new' OR indexname LIKE '%created_by%'
ORDER BY idx_tup_read DESC;
```

## Откат в случае проблем

Если нужно откатить изменения:

```sql
-- Удалить новые индексы
DROP INDEX IF EXISTS idx_court_cases_project_new;
DROP INDEX IF EXISTS idx_court_cases_status_new;
-- ... и так далее

-- Восстановить старые индексы  
CREATE INDEX idx_claims_project ON claims(project_id);
CREATE INDEX idx_claims_status ON claims(claim_status_id);
-- ... и так далее
```

## Рекомендации по выполнению

1. **Время выполнения:** Непиковые часы (ночь/выходные)
2. **Мониторинг:** Следите за нагрузкой на диск и CPU
3. **Бэкап:** Сделайте резервную копию перед началом
4. **Тестирование:** Сначала на staging среде

## Ожидаемый результат

После оптимизации вы должны увидеть:
- ✅ Ускорение дашборда в 5-10 раз
- ✅ Быстрее загрузка списков заявок/дефектов  
- ✅ Быстрее пользовательская статистика
- ✅ Меньше нагрузки на базу данных