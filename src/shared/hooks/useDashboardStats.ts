import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { useVisibleProjects } from '@/entities/project';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useOptimizedDashboardStats } from '@/shared/hooks/useOptimizedQueries';
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

  // Используем оптимизированный хук для получения статистики
  const optimizedStats = useOptimizedDashboardStats(projectId!);

  const statsQuery = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', projectId],
    enabled: !!projectId && !optimizedStats.data,
    queryFn: async () => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) throw new Error('no project');

      // Получаем дополнительные данные для зданий
      const { data: bldData, error: bldErr } = await supabase.rpc('buildings_by_project', { pid: project.id });
      if (bldErr) throw bldErr;
      const buildingCount = (bldData || []).filter((b: any) => b.building).length;

      // Используем оптимизированную статистику как основу
      const baseStats = optimizedStats.data;
      if (!baseStats) throw new Error('No optimized stats available');

      return {
        projects: [{ 
          id: project.id, 
          name: project.name, 
          buildingCount,
          claimsOpen: baseStats.claims_open,
          claimsClosed: baseStats.claims_resolved,
          defectsOpen: baseStats.defects_open,
          defectsClosed: baseStats.defects_fixed,
          courtCasesOpen: baseStats.court_cases_total, // TODO: разделить на открытые/закрытые
          courtCasesClosed: 0,
          lettersTotal: baseStats.letters_total,
          unitsTotal: baseStats.units_total,
        }],
        courtCasesOpen: baseStats.court_cases_total,
        courtCasesClosed: 0,
      } as DashboardStats;
    },
    staleTime: 60_000,
  });

  // Возвращаем оптимизированную статистику если она доступна
  if (optimizedStats.data) {
    return {
      ...optimizedStats,
      data: {
        projects: [{
          id: projectId!,
          name: projects.find(p => p.id === projectId)?.name || 'Unknown',
          buildingCount: 0, // TODO: получить из отдельного запроса если нужно
          claimsOpen: optimizedStats.data.claims_open,
          claimsClosed: optimizedStats.data.claims_resolved,
          defectsOpen: optimizedStats.data.defects_open,
          defectsClosed: optimizedStats.data.defects_fixed,
          courtCasesOpen: optimizedStats.data.court_cases_total,
          courtCasesClosed: 0,
          lettersTotal: optimizedStats.data.letters_total,
          unitsTotal: optimizedStats.data.units_total,
        }],
        courtCasesOpen: optimizedStats.data.court_cases_total,
        courtCasesClosed: 0,
      } as DashboardStats
    };
  }

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
