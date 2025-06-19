/**
 * Хелперы для формирования ключей React Query.
 */

/**
 * Ключ запросов списка замечаний.
 * @param projectId ID выбранного проекта
 * @param projectIds Список проектов пользователя
 */
export const ticketsKey = (projectId: number | null, projectIds: number[]) => [
  'tickets',
  projectId,
  projectIds.join(',')
];

/**
 * Ключ запросов короткого списка замечаний.
 * @param projectId ID выбранного проекта
 * @param projectIds Список проектов пользователя
 */
export const ticketsSimpleKey = (
  projectId: number | null,
  projectIds: number[],
) => ['tickets-simple', projectId, projectIds.join(',')];

