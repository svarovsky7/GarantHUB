-- Добавление флага только своего проекта для ролей
ALTER TABLE role_permissions
ADD COLUMN only_assigned_project boolean NOT NULL DEFAULT false;
