-- Создание таблицы связей претензий с судебными делами
CREATE TABLE IF NOT EXISTS court_case_claim_links (
    id BIGSERIAL PRIMARY KEY,
    case_id BIGINT NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
    claim_id BIGINT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_court_case_claim_links_case
  ON court_case_claim_links(case_id);
CREATE INDEX IF NOT EXISTS idx_court_case_claim_links_claim
  ON court_case_claim_links(claim_id);
