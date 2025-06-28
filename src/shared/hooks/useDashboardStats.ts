import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { useVisibleProjects } from '@/entities/project';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useClaimStatuses } from '@/entities/claimStatus';
import { useDefectStatuses } from '@/entities/defectStatus';
import type { DashboardStats } from '@/shared/types/dashboardStats';

/**
 * Загружает статистику для дашборда и подписывается на обновления.
 *
 * @param pid Опциональный идентификатор проекта. Если не указан,
 *            используется выбранный в приложении проект.
 */
export function useDashboardStats(pid?: number | null) {
  const qc = useQueryClient();
  const { data: projects = [] } = useVisibleProjects();
  const projectId = pid ?? useProjectId();
  const { data: claimStatuses = [] } = useClaimStatuses();
  const { data: defectStatuses = [] } = useDefectStatuses();

  const closedClaimId = claimStatuses.find((s) => /закры/i.test(s.name))?.id ?? null;
  const closedDefectId = defectStatuses.find((s) => /закры/i.test(s.name))?.id ?? null;

  const statsQuery = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', projectId, closedClaimId, closedDefectId],
    enabled: !!projectId,
    queryFn: async () => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) throw new Error('no project');

      const { data, error } = await supabase.rpc('dashboard_stats', {
        pid: project.id,
        closed_claim_id: closedClaimId,
        closed_defect_id: closedDefectId,
      });
      if (error) throw error;
      return data as DashboardStats;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase.channel(`dashboard-stats-${projectId}`);
    const tables = ['units', 'claims', 'defects', 'court_cases', 'letters'];
    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `project_id=eq.${projectId}` },
        () => qc.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      );
    });
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [projectId, qc]);

  return statsQuery;
}
