-- Fix defects table schema

-- 1. Rename columns
ALTER TABLE defects RENAME COLUMN defect_status_id TO status_id;
ALTER TABLE defects RENAME COLUMN defect_type_id  TO type_id;

-- 2. Add new columns
ALTER TABLE defects
  ADD COLUMN project_id    INT  NOT NULL,
  ADD COLUMN unit_id       INT,
  ADD COLUMN created_by    UUID,
  ADD COLUMN updated_by    UUID,
  ADD COLUMN updated_at    TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN description_tsv TSVECTOR GENERATED ALWAYS AS
    (to_tsvector('russian', coalesce(description,''))) STORED;

-- 3. Foreign keys
ALTER TABLE defects
  ADD CONSTRAINT fk_defects_project    FOREIGN KEY (project_id) REFERENCES projects(id),
  ADD CONSTRAINT fk_defects_unit       FOREIGN KEY (unit_id)    REFERENCES units(id),
  ADD CONSTRAINT fk_defects_type       FOREIGN KEY (type_id)    REFERENCES defect_types(id),
  ADD CONSTRAINT fk_defects_status     FOREIGN KEY (status_id)  REFERENCES statuses(id),
  ADD CONSTRAINT fk_defects_brigade    FOREIGN KEY (brigade_id) REFERENCES brigades(id)    ON DELETE SET NULL,
  ADD CONSTRAINT fk_defects_contractor FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_defects_fixed_by   FOREIGN KEY (fixed_by)   REFERENCES profiles(id)    ON DELETE SET NULL,
  ADD CONSTRAINT fk_defects_created_by FOREIGN KEY (created_by) REFERENCES profiles(id)    ON DELETE SET NULL,
  ADD CONSTRAINT fk_defects_updated_by FOREIGN KEY (updated_by) REFERENCES profiles(id)    ON DELETE SET NULL;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_defects_fast  ON defects(project_id, status_id, type_id);
CREATE INDEX IF NOT EXISTS idx_defects_tsv   ON defects USING GIN(description_tsv);
