-- Создание таблиц для учёта судебных дел

-- 1. Карточки судебных дел
CREATE TABLE IF NOT EXISTS court_cases (
    id BIGSERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    unit_id INTEGER REFERENCES units(id),
    date DATE NOT NULL,
    stage_id INTEGER REFERENCES litigation_stages(id),
    status INTEGER NOT NULL REFERENCES litigation_stages(id),
    responsible_lawyer_id UUID REFERENCES profiles(id),
    fix_start_date DATE,
    fix_end_date DATE,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_court_cases_project ON court_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_court_cases_unit ON court_cases(unit_id);
CREATE INDEX IF NOT EXISTS idx_court_cases_stage ON court_cases(stage_id);
CREATE INDEX IF NOT EXISTS idx_court_cases_status ON court_cases(status);
CREATE INDEX IF NOT EXISTS idx_court_cases_lawyer ON court_cases(responsible_lawyer_id);

-- 2. Участники дел
CREATE TABLE IF NOT EXISTS court_case_parties (
    id BIGSERIAL PRIMARY KEY,
    case_id BIGINT NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
    party_type INTEGER NOT NULL REFERENCES party_types(id),
    contractor_id INTEGER REFERENCES contractors(id),
    person_id INTEGER REFERENCES persons(id),
    project_id INTEGER NOT NULL REFERENCES projects(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_parties_case ON court_case_parties(case_id);
CREATE INDEX IF NOT EXISTS idx_case_parties_contractor ON court_case_parties(contractor_id);
CREATE INDEX IF NOT EXISTS idx_case_parties_person ON court_case_parties(person_id);

-- 3. Справочник недостатков
CREATE TABLE IF NOT EXISTS defects (
    id BIGSERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    description TEXT NOT NULL,
    fix_cost NUMERIC(14,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_defects_project ON defects(project_id);

-- 3.1. Связь «дело ↔ недостаток»
CREATE TABLE IF NOT EXISTS court_case_defects (
    case_id BIGINT NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
    defect_id BIGINT NOT NULL REFERENCES defects(id) ON DELETE RESTRICT,
    PRIMARY KEY (case_id, defect_id)
);

CREATE INDEX IF NOT EXISTS idx_case_defects_case ON court_case_defects(case_id);
CREATE INDEX IF NOT EXISTS idx_case_defects_defect ON court_case_defects(defect_id);

-- 5. Корреспонденция по делу
-- Используем справочник letter_types
CREATE TABLE IF NOT EXISTS letters (
    id BIGSERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    case_id BIGINT NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    letter_type_id BIGINT NOT NULL REFERENCES letter_types(id),
    letter_date DATE NOT NULL,
    subject TEXT,
    sender TEXT,
    receiver TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_letters_case ON letters(case_id);
CREATE INDEX IF NOT EXISTS idx_letters_project ON letters(project_id);
CREATE INDEX IF NOT EXISTS idx_letters_date ON letters(letter_date);
