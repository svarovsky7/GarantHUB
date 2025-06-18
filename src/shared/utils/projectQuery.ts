import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Добавляет фильтр по проекту или списку проектов в запрос Supabase.
 * @param query исходный запрос
 * @param projectId выбранный проект
 * @param projectIds список проектов пользователя
 * @param onlyAssigned если true, используется фильтрация по списку projectIds
 */
export function filterByProjects<T extends PostgrestFilterBuilder<any, any, any>>(
  query: T,
  projectId: number | null,
  projectIds: number[],
  onlyAssigned?: boolean,
): T {
  if (onlyAssigned) {
    return query.in('project_id', projectIds.length ? projectIds : [-1]);
  }
  return projectId != null ? query.eq('project_id', projectId) : query;
}
