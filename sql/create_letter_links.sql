-- Добавление таблицы для хранения связей писем
-- Таблица содержит связь "родительское письмо -> дочернее письмо"

CREATE TABLE IF NOT EXISTS letter_links (
    parent_id BIGINT NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    child_id BIGINT NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (parent_id, child_id)
);

-- Один дочерний документ может иметь только одного родителя
CREATE UNIQUE INDEX IF NOT EXISTS idx_letter_links_child ON letter_links(child_id);
CREATE INDEX IF NOT EXISTS idx_letter_links_parent ON letter_links(parent_id);
