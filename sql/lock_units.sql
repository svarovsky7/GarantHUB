-- Добавление признака блокировки объектов
ALTER TABLE units ADD COLUMN locked boolean NOT NULL DEFAULT false;

-- Право блокировки объектов для ролей
ALTER TABLE role_permissions ADD COLUMN can_lock_units boolean NOT NULL DEFAULT false;
