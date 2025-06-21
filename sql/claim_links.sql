-- Таблица связей претензий
CREATE TABLE IF NOT EXISTS claim_links (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    child_id BIGINT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Одно дочернее может иметь только одну связь
CREATE UNIQUE INDEX IF NOT EXISTS claim_links_child_idx ON claim_links(child_id);
