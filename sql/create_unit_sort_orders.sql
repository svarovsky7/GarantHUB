-- Создание таблицы для хранения направления сортировки квартир на этажах
CREATE TABLE IF NOT EXISTS unit_sort_orders (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  building TEXT,
  floor TEXT NOT NULL,
  sort_direction TEXT,
  UNIQUE (project_id, building, floor)
);
