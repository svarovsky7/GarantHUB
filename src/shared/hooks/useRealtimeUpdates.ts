import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import { useRolePermission } from '@/entities/rolePermission';
import type { RoleName } from '@/shared/types/rolePermission';
import { ticketsKey } from '@/shared/utils/queryKeys';

/**
 * Подписка на создание записей в ключевых таблицах.
 * Использует один канал Supabase для минимизации запросов
 * к `realtime.list_changes` и инвалидирует кэш React Query
 * при появлении новых данных.
 */
export function useRealtimeUpdates() {
  const qc = useQueryClient();
  const projectId = useProjectId();
  const projectIds = useAuthStore((s) => s.profile?.project_ids) ?? [];
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);

  useEffect(() => {
    const ids = perm?.only_assigned_project
      ? projectIds
      : projectId
        ? [projectId]
        : [];
    const subscribeAllLetters = !perm?.only_assigned_project && !projectId;
    if (ids.length === 0 && !subscribeAllLetters) return;

    const channel = supabase.channel('realtime-updates');
    ids.forEach((pid) => {
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'tickets', filter: `project_id=eq.${pid}` },
          () => qc.invalidateQueries({ queryKey: ticketsKey(projectId, projectIds) }),
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `project_id=eq.${pid}` },
          () => qc.invalidateQueries({ queryKey: ticketsKey(projectId, projectIds) }),
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'tickets', filter: `project_id=eq.${pid}` },
          () => qc.invalidateQueries({ queryKey: ticketsKey(projectId, projectIds) }),
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'court_cases', filter: `project_id=eq.${pid}` },
          () => qc.invalidateQueries({ queryKey: ['court_cases', pid] }),
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'court_cases', filter: `project_id=eq.${pid}` },
          () => qc.invalidateQueries({ queryKey: ['court_cases', pid] }),
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'court_cases', filter: `project_id=eq.${pid}` },
          () => qc.invalidateQueries({ queryKey: ['court_cases', pid] }),
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'letters', filter: `project_id=eq.${pid}` },
          () => qc.invalidateQueries({ queryKey: ['letters'] }),
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'letters', filter: `project_id=eq.${pid}` },
          () => qc.invalidateQueries({ queryKey: ['letters'] }),
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'letters', filter: `project_id=eq.${pid}` },
          () => qc.invalidateQueries({ queryKey: ['letters'] }),
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'unit_history', filter: `project_id=eq.${pid}` },
          () => qc.invalidateQueries({ queryKey: ['unit_history'] }),
        );
    });
    if (subscribeAllLetters) {
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'letters' },
          () => qc.invalidateQueries({ queryKey: ['letters'] }),
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'letters' },
          () => qc.invalidateQueries({ queryKey: ['letters'] }),
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'letters' },
          () => qc.invalidateQueries({ queryKey: ['letters'] }),
        );
    }
    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, projectIds.join(','), perm?.only_assigned_project, qc]);
}
