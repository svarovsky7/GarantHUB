-- Таблица связей пользователей и проектов
CREATE TABLE IF NOT EXISTS profiles_projects (
    profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    project_id integer REFERENCES projects(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, project_id)
);

-- Перенос существующих связей из поля profiles.project_id
INSERT INTO profiles_projects(profile_id, project_id)
SELECT id, project_id FROM profiles WHERE project_id IS NOT NULL
ON CONFLICT DO NOTHING;
