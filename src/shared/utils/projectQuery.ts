import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Добавляет фильтр по проекту или списку проектов в запрос Supabase.
 *
 * Логика фильтрации:
 * - Если у роли есть ограничение "Только свой проект" (onlyAssigned = true):
 *   фильтрует по проектам из profiles_projects
 * - Если у роли НЕТ ограничения (onlyAssigned = false):
 *   НЕ фильтрует, показывает все проекты в системе
 *
 * @param query исходный запрос
 * @param projectId выбранный активный проект (не используется для фильтрации данных)
 * @param projectIds список проектов пользователя из profiles_projects
 * @param onlyAssigned true если у роли включено "Только свой проект"
 */
export function filterByProjects<T extends PostgrestFilterBuilder<any, any, any>>(
  query: T,
  projectId: number | null,
  projectIds: number[],
  onlyAssigned?: boolean,
): T {
  if (onlyAssigned) {
    // Роль с ограничением "только свой проект" - показываем только назначенные проекты
    return query.in('project_id', projectIds.length ? projectIds : [-1]);
  }
  // Роль без ограничения - показываем ВСЕ проекты (не фильтруем)
  return query;
}
