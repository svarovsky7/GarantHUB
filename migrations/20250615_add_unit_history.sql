-- Таблица хронологии изменений по объектам
create table if not exists unit_history (
  id bigserial primary key,
  project_id integer not null references projects(id) on delete cascade,
  unit_id integer not null references units(id) on delete cascade,
  entity_type text not null check (entity_type in ('ticket','letter','court_case')),
  entity_id bigint not null,
  action text not null check (action in ('created','updated','deleted')),
  changed_by uuid,
  changed_at timestamp with time zone default now()
);

-- Функция логирования изменений
create or replace function log_ticket_history() returns trigger as $$
declare
  u integer;
  act text := lower(tg_op);
begin
  if act = 'delete' then
    foreach u in array old.unit_ids loop
      insert into unit_history(project_id, unit_id, entity_type, entity_id, action, changed_by, changed_at)
      values(old.project_id, u, 'ticket', old.id, act, old.created_by, now());
    end loop;
    return old;
  else
    foreach u in array new.unit_ids loop
      insert into unit_history(project_id, unit_id, entity_type, entity_id, action, changed_by, changed_at)
      values(new.project_id, u, 'ticket', new.id, act, new.created_by, now());
    end loop;
    return new;
  end if;
end;
$$ language plpgsql;

create or replace function log_case_history() returns trigger as $$
declare
  u integer;
  act text := lower(tg_op);
begin
  if act = 'delete' then
    foreach u in array old.unit_ids loop
      insert into unit_history(project_id, unit_id, entity_type, entity_id, action, changed_by, changed_at)
      values(old.project_id, u, 'court_case', old.id, act, old.responsible_lawyer_id, now());
    end loop;
    return old;
  else
    foreach u in array new.unit_ids loop
      insert into unit_history(project_id, unit_id, entity_type, entity_id, action, changed_by, changed_at)
      values(new.project_id, u, 'court_case', new.id, act, new.responsible_lawyer_id, now());
    end loop;
    return new;
  end if;
end;
$$ language plpgsql;

create or replace function log_letter_history() returns trigger as $$
declare
  u integer;
  act text := lower(tg_op);
begin
  if act = 'delete' then
    foreach u in array old.unit_ids loop
      insert into unit_history(project_id, unit_id, entity_type, entity_id, action, changed_by, changed_at)
      values(old.project_id, u, 'letter', old.id, act, old.responsible_user_id, now());
    end loop;
    return old;
  else
    foreach u in array new.unit_ids loop
      insert into unit_history(project_id, unit_id, entity_type, entity_id, action, changed_by, changed_at)
      values(new.project_id, u, 'letter', new.id, act, new.responsible_user_id, now());
    end loop;
    return new;
  end if;
end;
$$ language plpgsql;

create trigger ticket_history_trg
  after insert or update or delete on tickets
  for each row execute procedure log_ticket_history();
create trigger case_history_trg
  after insert or update or delete on court_cases
  for each row execute procedure log_case_history();
create trigger letter_history_trg
  after insert or update or delete on letters
  for each row execute procedure log_letter_history();
