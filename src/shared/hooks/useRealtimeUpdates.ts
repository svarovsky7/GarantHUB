import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';

/**
 * Подписка на создание записей в ключевых таблицах.
 * Использует один канал Supabase для минимизации запросов
 * к `realtime.list_changes` и инвалидирует кэш React Query
 * при появлении новых данных.
 */
export function useRealtimeUpdates() {
  const qc = useQueryClient();
  const projectId = useProjectId();

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase.channel(`realtime-updates-${projectId}`);
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'court_cases', filter: `project_id=eq.${projectId}` },
        () => qc.invalidateQueries({ queryKey: ['court_cases', projectId] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'letters', filter: `project_id=eq.${projectId}` },
        () => qc.invalidateQueries({ queryKey: ['letters'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'claims', filter: `project_id=eq.${projectId}` },
        () => qc.invalidateQueries({ queryKey: ['claims'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'units', filter: `project_id=eq.${projectId}` },
        () => qc.invalidateQueries({ queryKey: ['units'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'defects', filter: `project_id=eq.${projectId}` },
        () => qc.invalidateQueries({ queryKey: ['defects'] }),
      );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, qc]);
}
