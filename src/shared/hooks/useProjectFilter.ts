import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import { useRolePermission } from '@/entities/rolePermission';
import type { RoleName } from '@/shared/types/rolePermission';
import { useMemo } from 'react';

/**
 * Возвращает набор ID проектов, доступных пользователю в рамках его роли.
 * Если в настройках роли включена опция "только свой проект", список
 * содержит все проекты, назначенные профилю. Иначе возвращает выбранный
 * в интерфейсе проект (одиночный массив). Поле `enabled` можно использовать
 * в React Query для активации запроса.
 */
export function useProjectFilter() {
  const projectId = useProjectId();
  const projectIds = useAuthStore((s) => s.profile?.project_ids) ?? [];
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);

  const ids = useMemo(() => {
    if (perm?.only_assigned_project) {
      return projectIds;
    }
    return projectId != null ? [projectId] : [];
  }, [perm?.only_assigned_project, projectId, projectIds]);

  return {
    projectId,
    projectIds,
    onlyAssigned: !!perm?.only_assigned_project,
    ids,
    enabled: ids.length > 0,
  };
}
