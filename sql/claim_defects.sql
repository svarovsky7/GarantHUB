-- Таблица связей претензий и дефектов
CREATE TABLE IF NOT EXISTS claim_defects (
    claim_id BIGINT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    defect_id BIGINT NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
    PRIMARY KEY (claim_id, defect_id)
);

CREATE INDEX IF NOT EXISTS claim_defects_defect_idx ON claim_defects(defect_id);
