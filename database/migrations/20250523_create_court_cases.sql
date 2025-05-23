/* =========================================================
   ENUM-типы
   ========================================================= */
CREATE TYPE court_case_status AS ENUM
  ('NEW', 'IN_PROGRESS', 'SETTLED', 'CLOSED');

CREATE TYPE party_type AS ENUM
  ('CLAIMANT', 'DEFENDANT', 'THIRD');

CREATE TYPE letter_type AS ENUM
  ('PRETENSION', 'CLAIM', 'ANSWER', 'NOTICE', 'OTHER');

/* =========================================================
   1. Таблица судебных дел
   ========================================================= */
CREATE TABLE court_cases (
  id                     BIGSERIAL PRIMARY KEY,
  internal_no            TEXT         NOT NULL UNIQUE,
  project_id             INTEGER      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  unit_id                INTEGER      REFERENCES units(id),
  stage_id               INTEGER      REFERENCES litigation_stages(id),
  status                 court_case_status NOT NULL DEFAULT 'NEW',
  responsible_lawyer_id  UUID         REFERENCES profiles(id),
  fix_start_date         DATE,
  fix_end_date           DATE,
  comments               TEXT,
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_court_cases_project      ON court_cases(project_id);
CREATE INDEX idx_court_cases_stage_status ON court_cases(stage_id, status);
CREATE INDEX idx_court_cases_lawyer       ON court_cases(responsible_lawyer_id, status);

/* =========================================================
   2. Стороны дела (множественные участники)
   ========================================================= */
CREATE TABLE court_case_parties (
  id            BIGSERIAL PRIMARY KEY,
  case_id       BIGINT       NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
  party_type    party_type   NOT NULL,
  contractor_id INTEGER      REFERENCES contractors(id),
  person_id     INTEGER      REFERENCES persons(id),
  project_id    INTEGER      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_case_parties_case   ON court_case_parties(case_id);
CREATE INDEX idx_case_parties_proj   ON court_case_parties(project_id);

/* =========================================================
   3. Недостатки (справочник) + связь с делом
   ========================================================= */
CREATE TABLE defects (
  id          BIGSERIAL PRIMARY KEY,
  project_id  INTEGER      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT         NOT NULL,
  fix_cost    NUMERIC(14,2),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_defects_project ON defects(project_id);

CREATE TABLE court_case_defects (
  case_id   BIGINT NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
  defect_id BIGINT NOT NULL REFERENCES defects(id)     ON DELETE RESTRICT,
  PRIMARY KEY (case_id, defect_id)
);

CREATE INDEX idx_case_defects_case ON court_case_defects(case_id);

/* =========================================================
   4. Требования + связь с делом
   ========================================================= */
CREATE TABLE demands (
  id              BIGSERIAL PRIMARY KEY,
  project_id      INTEGER      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           TEXT         NOT NULL,
  amount_claimed  NUMERIC(14,2),
  amount_awarded  NUMERIC(14,2),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_demands_project ON demands(project_id);

CREATE TABLE court_case_demands (
  case_id   BIGINT NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
  demand_id BIGINT NOT NULL REFERENCES demands(id)     ON DELETE RESTRICT,
  PRIMARY KEY (case_id, demand_id)
);

CREATE INDEX idx_case_demands_case ON court_case_demands(case_id);

/* =========================================================
   5. Письма
   ========================================================= */
CREATE TABLE letters (
  id           BIGSERIAL PRIMARY KEY,
  project_id   INTEGER      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  case_id      BIGINT       NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
  number       TEXT         NOT NULL,
  letter_type  letter_type  NOT NULL,
  letter_date  DATE         NOT NULL,
  subject      TEXT,
  sender       TEXT,
  receiver     TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_letters_case_number ON letters(case_id, number);
CREATE INDEX       idx_letters_project      ON letters(project_id);

/* =========================================================
   6. Мировые соглашения
   ========================================================= */
CREATE TABLE settlements (
  id             BIGSERIAL PRIMARY KEY,
  project_id     INTEGER      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  case_id        BIGINT       NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
  agreement_no   TEXT         NOT NULL,
  agreement_date DATE         NOT NULL,
  amount         NUMERIC(14,2),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settlements_project ON settlements(project_id);

/* =========================================================
   7. Платёжные поручения
   ========================================================= */
CREATE TABLE payment_orders (
  id         BIGSERIAL PRIMARY KEY,
  project_id INTEGER      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  case_id    BIGINT       NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
  order_no   TEXT         NOT NULL,
  order_date DATE         NOT NULL,
  amount     NUMERIC(14,2),
  payer      TEXT,
  recipient  TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_orders_project ON payment_orders(project_id);

/* =========================================================
   8. Расширяем таблицу attachments для связей с делом и письмом
   (если ещё не сделано)
   ========================================================= */
ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS court_case_id BIGINT REFERENCES court_cases(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS letter_id     BIGINT REFERENCES letters(id)     ON DELETE CASCADE;
