import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { fetchDashboardStats } from '@/shared/api/dashboardRpc';
import { useVisibleProjects } from '@/entities/project';
import { useClaimStatuses } from '@/entities/claimStatus';
import { useDefectStatuses } from '@/entities/defectStatus';
import type { DashboardStats } from '@/shared/types/dashboardStats';

/**
 * Загружает статистику для дашборда и подписывается на обновления.
 */
export function useDashboardStats() {
  const qc = useQueryClient();
  const { data: projects = [] } = useVisibleProjects();
  const { data: claimStatuses = [] } = useClaimStatuses();
  const { data: defectStatuses = [] } = useDefectStatuses();

  const closedClaimId = claimStatuses.find((s) => /закры/i.test(s.name))?.id ?? null;
  const closedDefectId = defectStatuses.find((s) => /закры/i.test(s.name))?.id ?? null;
  const projectIds = projects.map((p) => p.id);

  const statsQuery = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', projectIds.join(','), closedClaimId, closedDefectId],
    enabled: projectIds.length > 0,
    queryFn: async () =>
      fetchDashboardStats({
        projectIds,
        closedClaimStatusId: closedClaimId,
        closedDefectStatusId: closedDefectId,
      }),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (projectIds.length === 0) return;
    const channel = supabase.channel('dashboard-stats');
    const tables = ['units', 'claims', 'defects', 'court_cases', 'letters'];
    tables.forEach((table) => {
      projectIds.forEach((pid) => {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: `project_id=eq.${pid}` },
          () => qc.invalidateQueries({ queryKey: ['dashboard-stats'] }),
        );
      });
    });
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [projectIds.join(','), qc]);

  return statsQuery;
}
