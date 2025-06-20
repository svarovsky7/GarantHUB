-- Обновление триггера создания профиля
-- Эта миграция устраняет ошибку Database error saving new user
-- Функция учитывает новую таблицу profiles_projects и поле project_ids

create or replace function public.handle_new_user()
returns trigger as $$
declare
  _project_ids integer[] := coalesce(
    array(select jsonb_array_elements_text(new.raw_user_meta_data->'project_ids')::int),
    array[]::integer[]
  );
  _role text := coalesce(new.raw_user_meta_data->>'role', 'USER');
  _name text := coalesce(new.raw_user_meta_data->>'name', '');
begin
  insert into public.profiles(id, email, name, role)
  values (new.id, new.email, _name, _role);

  if array_length(_project_ids, 1) > 0 then
    insert into public.profiles_projects(profile_id, project_id)
    select new.id, pid from unnest(_project_ids) as pid;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Триггер после вставки в auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
