#!/usr/bin/env node
/**
 * Генератор AI-контекста для базы данных
 * Создает компактные JSON-файлы и примеры SQL для помощи ИИ (Claude Code, Codex)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const EXPORTS_DIR = path.join(PROJECT_ROOT, 'supabase', 'exports');
const AI_CONTEXT_DIR = path.join(PROJECT_ROOT, 'supabase', 'ai_context');
const PROD_SQL = path.join(PROJECT_ROOT, 'supabase', 'migrations', 'prod.sql');

// Создаем директорию если не существует
if (!fs.existsSync(AI_CONTEXT_DIR)) {
  fs.mkdirSync(AI_CONTEXT_DIR, { recursive: true });
}

/**
 * Вычисляет SHA256 хэш файла
 */
function getFileHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Загружает JSON файл
 */
function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Сохраняет JSON в файл с красивым форматированием
 */
function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Created: ${path.basename(filePath)}`);
}

/**
 * Фильтрует только public схему (убирает auth, storage, realtime)
 */
function filterPublicSchema(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => key.startsWith('public.'))
  );
}

/**
 * Генерирует ai_manifest.json
 */
function generateManifest() {
  const files = {
    'tables.json': path.join(EXPORTS_DIR, 'tables.json'),
    'indexes.json': path.join(EXPORTS_DIR, 'indexes.json'),
    'triggers.json': path.join(EXPORTS_DIR, 'triggers.json'),
    'functions.json': path.join(EXPORTS_DIR, 'functions.json'),
    'enums.json': path.join(EXPORTS_DIR, 'enums.json'),
    'prod.sql': PROD_SQL
  };

  const hashes = {};
  for (const [name, filePath] of Object.entries(files)) {
    if (fs.existsSync(filePath)) {
      hashes[name] = getFileHash(filePath);
    }
  }

  return {
    generated_at: new Date().toISOString(),
    generator: 'generate-ai-context.mjs',
    source_files: hashes,
    files: [
      'ai_manifest.json',
      'ai_tables_min.json',
      'ai_tables_full.json',
      'ai_relations.json',
      'ai_functions_min.json',
      'ai_functions_full.json',
      'ai_triggers_min.json',
      'ai_enums_min.json',
      'ai_examples.sql'
    ]
  };
}

/**
 * Генерирует ai_tables_min.json - компактное описание таблиц
 */
function generateTablesMin(tables) {
  const publicTables = filterPublicSchema(tables);
  const result = {};

  for (const [key, table] of Object.entries(publicTables)) {
    const tableName = table.name;

    result[tableName] = {
      comment: table.comment || '',
      columns: table.columns.map(col => ({
        name: col.name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default: col.default,
      })),
      primary_keys: table.constraints
        .filter(c => c.type === 'PRIMARY KEY')
        .map(c => c.column)
        .filter(Boolean),
      foreign_keys: table.constraints
        .filter(c => c.type === 'FOREIGN KEY')
        .map(c => ({
          column: c.column,
          references: `${c.foreign_table_schema}.${c.foreign_table}(${c.foreign_column})`
        }))
        .filter(fk => fk.column && fk.references)
    };
  }

  return result;
}

/**
 * Генерирует ai_tables_full.json - полное описание таблиц с индексами
 */
function generateTablesFull(tables, indexes) {
  const publicTables = filterPublicSchema(tables);
  const publicIndexes = filterPublicSchema(indexes);
  const result = {};

  for (const [key, table] of Object.entries(publicTables)) {
    const tableName = table.name;
    const tableIndexes = Object.entries(publicIndexes)
      .filter(([idxKey]) => idxKey.startsWith(`public.${tableName}.`))
      .map(([_, idx]) => ({
        name: idx.name,
        columns: idx.columns || [],
        unique: idx.unique || false,
        type: idx.type || 'btree'
      }));

    result[tableName] = {
      ...generateTablesMin({[key]: table})[tableName],
      indexes: tableIndexes,
      constraints: table.constraints.map(c => ({
        name: c.name,
        type: c.type,
        column: c.column
      }))
    };
  }

  return result;
}

/**
 * Извлекает FK из prod.sql используя эвристики имен constraints
 * Так как в prod.sql FK определены как REFERENCES None.None(None),
 * используем паттерны именования для восстановления связей
 */
function extractForeignKeysFromSQL(prodSqlPath) {
  if (!fs.existsSync(prodSqlPath)) {
    return [];
  }

  const sql = fs.readFileSync(prodSqlPath, 'utf8');
  const relations = [];

  let currentTable = null;
  const lines = sql.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Определяем текущую таблицу
    const tableMatch = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.(\w+)/i.exec(line);
    if (tableMatch) {
      currentTable = tableMatch[1];
    }

    // Ищем FK constraints
    if (currentTable) {
      // Паттерн: CONSTRAINT name_column_fkey FOREIGN KEY (column) REFERENCES None.None(None)
      const fkMatch = /CONSTRAINT\s+(\w+)_fkey\s+FOREIGN\s+KEY\s+\(([^)]+)\)/i.exec(line);
      if (fkMatch) {
        const [_, constraintBase, fromColumn] = fkMatch;
        const cleanColumn = fromColumn.trim();

        // Эвристика: пытаемся определить целевую таблицу из имени constraint
        // Формат: table_column_fkey или просто column_fkey
        let toTable = null;
        let toColumn = 'id'; // По умолчанию FK указывает на id

        // Паттерны:
        // 1. table_column_fkey → таблица: table, колонка: id
        // 2. column_fkey → таблица извлекается из имени колонки

        // Убираем префикс currentTable из constraint если есть
        const withoutTablePrefix = constraintBase.replace(new RegExp(`^${currentTable}_`), '');

        // Определяем таблицу из колонки
        if (cleanColumn.endsWith('_id')) {
          // engineer_id → engineers (множественное число)
          // project_id → projects
          // claim_id → claims
          const baseName = cleanColumn.replace(/_id$/, '');

          // Простая эвристика pluralization
          if (baseName === 'status') {
            toTable = 'statuses';
          } else if (baseName === 'category') {
            toTable = 'categories';
          } else if (baseName.endsWith('y')) {
            toTable = baseName.slice(0, -1) + 'ies';
          } else {
            toTable = baseName + 's';
          }
        } else if (cleanColumn === 'created_by' || cleanColumn === 'updated_by' || cleanColumn === 'uploaded_by' || cleanColumn === 'engineer_id' || cleanColumn === 'fixed_by') {
          toTable = 'profiles';
        } else if (cleanColumn.endsWith('_user_id')) {
          toTable = 'profiles';
        }

        if (toTable && currentTable !== toTable) {
          relations.push({
            from_table: currentTable,
            from_column: cleanColumn,
            to_table: toTable,
            to_column: toColumn,
            constraint_name: constraintBase + '_fkey'
          });
        }
      }
    }

    // Если закончилась таблица
    if (currentTable && /\);/.test(line)) {
      currentTable = null;
    }
  }

  return relations;
}

/**
 * Генерирует ai_relations.json - связи между таблицами
 */
function generateRelations(prodSqlPath) {
  // Извлекаем FK напрямую из SQL
  const relations = extractForeignKeysFromSQL(prodSqlPath);

  return {
    total: relations.length,
    relations: relations.sort((a, b) => a.from_table.localeCompare(b.from_table))
  };
}

/**
 * Генерирует ai_functions_min.json - сигнатуры функций
 */
function generateFunctionsMin(functions) {
  const publicFunctions = filterPublicSchema(functions);
  const result = {};

  for (const [key, func] of Object.entries(publicFunctions)) {
    // Извлекаем имя функции без схемы и аргументов
    const fullName = key.replace('public.', '');
    const functionName = func.name;

    // Простое описание на основе комментария или SQL
    let purpose = func.comment || '';
    if (!purpose && func.sql) {
      // Пытаемся извлечь описание из SQL комментария
      const commentMatch = func.sql.match(/COMMENT ON FUNCTION .* IS '([^']+)'/);
      if (commentMatch) {
        purpose = commentMatch[1];
      }
    }

    result[fullName] = {
      name: functionName,
      arguments: func.arguments || '',
      purpose: purpose || 'No description',
      signature: `${functionName}(${func.arguments || ''})`
    };
  }

  return result;
}

/**
 * Генерирует ai_functions_full.json - расширенное описание функций
 */
function generateFunctionsFull(functions) {
  const publicFunctions = filterPublicSchema(functions);
  const result = {};

  for (const [key, func] of Object.entries(publicFunctions)) {
    const fullName = key.replace('public.', '');
    const minData = generateFunctionsMin({[key]: func})[fullName];

    // Анализируем SQL для определения таблиц и побочных эффектов
    const sql = func.sql || '';
    const tables = [];
    const tableMatches = sql.matchAll(/(?:FROM|JOIN|INTO|UPDATE|DELETE FROM)\s+([a-z_]+)/gi);
    for (const match of tableMatches) {
      const table = match[1];
      if (!tables.includes(table)) {
        tables.push(table);
      }
    }

    const hasInsert = /INSERT INTO/i.test(sql);
    const hasUpdate = /UPDATE/i.test(sql);
    const hasDelete = /DELETE FROM/i.test(sql);
    const hasTrigger = /TRIGGER/i.test(sql);

    const sideEffects = [];
    if (hasInsert) sideEffects.push('INSERT');
    if (hasUpdate) sideEffects.push('UPDATE');
    if (hasDelete) sideEffects.push('DELETE');
    if (hasTrigger) sideEffects.push('TRIGGER');

    result[fullName] = {
      ...minData,
      related_tables: tables,
      side_effects: sideEffects,
      is_trigger_function: /RETURNS\s+trigger/i.test(sql)
    };
  }

  return result;
}

/**
 * Генерирует ai_triggers_min.json - описание триггеров
 */
function generateTriggersMin(triggers) {
  const publicTriggers = filterPublicSchema(triggers);
  const result = [];

  for (const [key, trigger] of Object.entries(publicTriggers)) {
    // Извлекаем информацию из SQL
    const sql = trigger.sql || '';

    // Парсим SQL триггера
    const tableMatch = sql.match(/ON\s+public\.([a-z_]+)/i);
    const functionMatch = sql.match(/EXECUTE FUNCTION\s+([a-z_]+)\(/i);
    const eventMatch = sql.match(/(BEFORE|AFTER)\s+(INSERT|UPDATE|DELETE|TRUNCATE)/i);
    const timingMatch = sql.match(/(BEFORE|AFTER)/i);

    result.push({
      name: trigger.name,
      table: tableMatch ? tableMatch[1] : 'unknown',
      function: functionMatch ? functionMatch[1] : 'unknown',
      event: eventMatch ? eventMatch[2] : 'unknown',
      timing: timingMatch ? timingMatch[1] : 'unknown',
      sql: sql
    });
  }

  return result.sort((a, b) => a.table.localeCompare(b.table));
}

/**
 * Генерирует ai_enums_min.json - перечисления (только public схема отсутствует, но включаем все)
 */
function generateEnumsMin(enums) {
  const result = {};

  for (const [key, enumDef] of Object.entries(enums)) {
    // Пропускаем служебные схемы (auth, storage, realtime)
    if (key.startsWith('auth.') || key.startsWith('storage.') || key.startsWith('realtime.')) {
      continue;
    }

    result[enumDef.name] = {
      schema: enumDef.schema,
      values: enumDef.values,
      comment: enumDef.comment || ''
    };
  }

  return result;
}

/**
 * Генерирует ai_examples.sql - примеры SQL операций
 */
function generateExamplesSQL(tables, triggers, functions) {
  const examples = [];

  examples.push(`-- ============================================`);
  examples.push(`-- AI CONTEXT: Примеры SQL операций`);
  examples.push(`-- Автоматически сгенерировано: ${new Date().toISOString()}`);
  examples.push(`-- ============================================`);
  examples.push(``);

  // Пример: Создание проекта
  examples.push(`-- Пример 1: Создание нового проекта`);
  examples.push(`INSERT INTO projects (name, description, created_by)`);
  examples.push(`VALUES ('ЖК Новая Москва', 'Жилой комплекс', auth.uid())`);
  examples.push(`RETURNING id, name, created_at;`);
  examples.push(``);

  // Пример: Создание юнита
  examples.push(`-- Пример 2: Создание объекта (unit) в проекте`);
  examples.push(`INSERT INTO units (project_id, name, building, floor, type)`);
  examples.push(`VALUES (1, 'Кв. 101', 'Корпус 1', 10, 'apartment')`);
  examples.push(`RETURNING id, name, project_id;`);
  examples.push(``);

  // Пример: Создание дефекта
  examples.push(`-- Пример 3: Создание дефекта`);
  examples.push(`INSERT INTO defects (`);
  examples.push(`  project_id, unit_id, type_id, status_id, description,`);
  examples.push(`  received_at, is_warranty, created_by`);
  examples.push(`)`);
  examples.push(`VALUES (`);
  examples.push(`  1, 1, 1, 1, 'Трещина в стене',`);
  examples.push(`  NOW(), true, auth.uid()`);
  examples.push(`)`);
  examples.push(`RETURNING id, description, created_at;`);
  examples.push(``);

  // Пример: Создание претензии
  examples.push(`-- Пример 4: Создание претензии (claim)`);
  examples.push(`INSERT INTO claims (`);
  examples.push(`  project_id, claim_no, claim_status_id, description,`);
  examples.push(`  claimed_on, engineer_id, created_by`);
  examples.push(`)`);
  examples.push(`VALUES (`);
  examples.push(`  1, 'CLM-2025-001', 1, 'Претензия по дефектам',`);
  examples.push(`  NOW(), auth.uid(), auth.uid()`);
  examples.push(`)`);
  examples.push(`RETURNING id, claim_no, created_at;`);
  examples.push(``);

  // Пример: Связь претензии с дефектом
  examples.push(`-- Пример 5: Связь претензии с дефектом`);
  examples.push(`INSERT INTO claim_defects (claim_id, defect_id, pre_trial_claim)`);
  examples.push(`VALUES (1, 1, false);`);
  examples.push(``);

  // Пример: Связь претензии с юнитом
  examples.push(`-- Пример 6: Связь претензии с объектом`);
  examples.push(`INSERT INTO claim_units (claim_id, unit_id)`);
  examples.push(`VALUES (1, 1);`);
  examples.push(``);

  // Пример: Использование VIEW claims_summary
  examples.push(`-- Пример 7: Получение сводной информации о претензиях (оптимизированный запрос)`);
  examples.push(`SELECT `);
  examples.push(`  id, claim_no, project_name, status_name, status_color,`);
  examples.push(`  engineer_name, created_by_name,`);
  examples.push(`  unit_ids, unit_names, building_names, -- агрегированные данные`);
  examples.push(`  defect_ids, attachments_count`);
  examples.push(`FROM claims_summary`);
  examples.push(`WHERE project_id = 1`);
  examples.push(`ORDER BY created_at DESC`);
  examples.push(`LIMIT 50;`);
  examples.push(``);

  // Пример: Использование VIEW defects_summary
  examples.push(`-- Пример 8: Получение сводной информации о дефектах (оптимизированный запрос)`);
  examples.push(`SELECT `);
  examples.push(`  id, description, type_name, status_name, status_color,`);
  examples.push(`  project_name, unit_name, unit_building,`);
  examples.push(`  claim_ids, unit_ids, unit_names, building_names, -- агрегированные данные`);
  examples.push(`  project_ids, project_names, has_pretrial_claim,`);
  examples.push(`  received_at, fixed_at, engineer_name, attachments_count`);
  examples.push(`FROM defects_summary`);
  examples.push(`WHERE project_id = 1`);
  examples.push(`ORDER BY id DESC`);
  examples.push(`LIMIT 50;`);
  examples.push(``);

  // Пример: Создание судебного дела
  examples.push(`-- Пример 9: Создание судебного дела`);
  examples.push(`INSERT INTO court_cases (`);
  examples.push(`  project_id, case_no, status_id, court_name,`);
  examples.push(`  filing_date, total_claim_amount, created_by`);
  examples.push(`)`);
  examples.push(`VALUES (`);
  examples.push(`  1, 'А40-123456/2025', 1, 'Арбитражный суд г. Москвы',`);
  examples.push(`  NOW(), 500000.00, auth.uid()`);
  examples.push(`)`);
  examples.push(`RETURNING id, case_no, total_claim_amount;`);
  examples.push(``);

  // Пример: Триггер update_court_case_total_claim_amount
  examples.push(`-- Пример 10: Связь претензии с судебным делом (триггер пересчитает total_claim_amount)`);
  examples.push(`INSERT INTO court_case_claims (court_case_id, claim_id, claim_amount)`);
  examples.push(`VALUES (1, 1, 150000.00);`);
  examples.push(`-- После выполнения триггер update_court_case_total_claim_amount`);
  examples.push(`-- автоматически обновит court_cases.total_claim_amount`);
  examples.push(``);

  // Пример: Обновление статуса
  examples.push(`-- Пример 11: Обновление статуса претензии`);
  examples.push(`UPDATE claims`);
  examples.push(`SET claim_status_id = 2, resolved_on = NOW()`);
  examples.push(`WHERE id = 1;`);
  examples.push(``);

  // Пример: Получение профиля пользователя
  examples.push(`-- Пример 12: Получение профиля текущего пользователя`);
  examples.push(`SELECT id, email, name, role, project_ids`);
  examples.push(`FROM profiles`);
  examples.push(`WHERE id = auth.uid();`);
  examples.push(``);

  return examples.join('\n');
}

/**
 * Главная функция
 */
function main() {
  console.log('🚀 Генерация AI-контекста для базы данных...\n');

  // Загружаем исходные файлы
  const tables = loadJSON(path.join(EXPORTS_DIR, 'tables.json'));
  const indexes = loadJSON(path.join(EXPORTS_DIR, 'indexes.json'));
  const triggers = loadJSON(path.join(EXPORTS_DIR, 'triggers.json'));
  const functions = loadJSON(path.join(EXPORTS_DIR, 'functions.json'));
  const enums = loadJSON(path.join(EXPORTS_DIR, 'enums.json'));

  // Генерируем AI-контекст
  const manifest = generateManifest();
  const tablesMin = generateTablesMin(tables);
  const tablesFull = generateTablesFull(tables, indexes);
  const relations = generateRelations(PROD_SQL);
  const functionsMin = generateFunctionsMin(functions);
  const functionsFull = generateFunctionsFull(functions);
  const triggersMin = generateTriggersMin(triggers);
  const enumsMin = generateEnumsMin(enums);
  const examplesSQL = generateExamplesSQL(tables, triggers, functions);

  // Сохраняем файлы
  saveJSON(path.join(AI_CONTEXT_DIR, 'ai_manifest.json'), manifest);
  saveJSON(path.join(AI_CONTEXT_DIR, 'ai_tables_min.json'), tablesMin);
  saveJSON(path.join(AI_CONTEXT_DIR, 'ai_tables_full.json'), tablesFull);
  saveJSON(path.join(AI_CONTEXT_DIR, 'ai_relations.json'), relations);
  saveJSON(path.join(AI_CONTEXT_DIR, 'ai_functions_min.json'), functionsMin);
  saveJSON(path.join(AI_CONTEXT_DIR, 'ai_functions_full.json'), functionsFull);
  saveJSON(path.join(AI_CONTEXT_DIR, 'ai_triggers_min.json'), triggersMin);
  saveJSON(path.join(AI_CONTEXT_DIR, 'ai_enums_min.json'), enumsMin);

  fs.writeFileSync(path.join(AI_CONTEXT_DIR, 'ai_examples.sql'), examplesSQL, 'utf8');
  console.log(`✅ Created: ai_examples.sql`);

  // Статистика
  console.log(`\n📊 Статистика:`);
  console.log(`   Таблиц (public): ${Object.keys(tablesMin).length}`);
  console.log(`   Связей (FK): ${relations.total}`);
  console.log(`   Функций (public): ${Object.keys(functionsMin).length}`);
  console.log(`   Триггеров (public): ${triggersMin.length}`);
  console.log(`   Перечислений: ${Object.keys(enumsMin).length}`);

  console.log(`\n✅ AI-контекст успешно создан в ${AI_CONTEXT_DIR}`);
}

main();
