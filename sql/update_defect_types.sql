-- Rename ticket_types to defect_types
ALTER TABLE ticket_types RENAME TO defect_types;
ALTER SEQUENCE ticket_types_id_seq RENAME TO defect_types_id_seq;

-- Update related foreign keys
ALTER TABLE defect_deadlines RENAME COLUMN ticket_type_id TO defect_type_id;

-- Remove type_id from tickets and add defect_ids array
ALTER TABLE tickets DROP COLUMN IF EXISTS type_id;
ALTER TABLE tickets ADD COLUMN defect_ids integer[] DEFAULT ARRAY[]::integer[];
