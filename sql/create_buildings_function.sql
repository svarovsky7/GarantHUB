-- Функция для получения списка корпусов проекта
CREATE OR REPLACE FUNCTION buildings_by_project(pid integer)
RETURNS TABLE(building text)
LANGUAGE sql STABLE AS $$
  SELECT DISTINCT building
  FROM units
  WHERE project_id = pid AND building IS NOT NULL
  ORDER BY building;
$$;
