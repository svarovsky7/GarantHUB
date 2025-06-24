-- Создание таблицы для уникальных идентификаторов дел
create table if not exists case_uids (
  id serial primary key,
  uid text not null unique
);

-- Добавление ссылки на uid к судебным делам
alter table court_cases
  add column if not exists case_uid_id integer references case_uids(id);

-- Добавление ссылки на uid к претензиям
alter table claims
  add column if not exists case_uid_id integer references case_uids(id);
