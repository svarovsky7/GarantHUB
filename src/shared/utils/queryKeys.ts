/**
 * Хелперы для формирования ключей React Query.
 */

/**
 * Ключ запросов списка замечаний.
 * @param projectId ID выбранного проекта
 * @param projectIds Список проектов пользователя
 */

export const queryKeys = {
  documents: () => ['documents'] as const,
} as const;

