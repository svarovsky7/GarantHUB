-- Обновление функции логирования unit_history, чтобы значения
-- поля action соответствовали check-constraint.
create or replace function map_action() returns text as $$
begin
  return case TG_OP
           when 'INSERT' then 'created'
           when 'UPDATE' then 'updated'
           when 'DELETE' then 'deleted'
         end;
end;
$$ language plpgsql;

create or replace function log_ticket_history() returns trigger as $$
declare
  u integer;
  act text := map_action();
begin
  if act = 'deleted' then
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
  act text := map_action();
begin
  if act = 'deleted' then
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
  act text := map_action();
begin
  if act = 'deleted' then
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

