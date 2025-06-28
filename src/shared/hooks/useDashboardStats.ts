import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { useVisibleProjects } from '@/entities/project';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useClaimStatuses } from '@/entities/claimStatus';
import { useDefectStatuses } from '@/entities/defectStatus';
import type { DashboardStats, ProjectStats } from '@/shared/types/dashboardStats';

/**
 * Загружает статистику для дашборда и подписывается на обновления.
 */
export function useDashboardStats() {
  const qc = useQueryClient();
  const { data: projects = [] } = useVisibleProjects();
  const projectId = useProjectId();
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

      const [{ count: unitCount }, { count: defectTotal }, { count: letterCount }] = await Promise.all([
        supabase.from('units').select('id', { count: 'exact', head: true }).eq('project_id', project.id),
        supabase.from('defects').select('id', { count: 'exact', head: true }).eq('project_id', project.id),
        supabase.from('letters').select('id', { count: 'exact', head: true }).eq('project_id', project.id),
      ]);

      const claimsQuery = supabase
        .from('claims')
        .select('id, engineer_id')
        .eq('project_id', project.id);

      const [
        { count: claimsTotal },
        { count: claimsClosed },
        { count: defectsTotal },
        { count: defectsClosed },
        { count: courtCases },
        { data: claimsRows },
      ] = await Promise.all([
        supabase.from('claims').select('id', { count: 'exact', head: true }).eq('project_id', project.id),
        closedClaimId
          ? supabase
              .from('claims')
              .select('id', { count: 'exact', head: true })
              .eq('project_id', project.id)
              .eq('claim_status_id', closedClaimId)
          : Promise.resolve({ count: 0 }),
        supabase.from('defects').select('id', { count: 'exact', head: true }).eq('project_id', project.id),
        closedDefectId
          ? supabase
              .from('defects')
              .select('id', { count: 'exact', head: true })
              .eq('project_id', project.id)
              .eq('status_id', closedDefectId)
          : Promise.resolve({ count: 0 }),
        supabase.from('court_cases').select('id', { count: 'exact', head: true }).eq('project_id', project.id),
        claimsQuery,
      ]);

      const claimIds = (claimsRows ?? []).map((r: any) => r.id);

      const engineerMap: Record<string, number> = {};
      (claimsRows ?? []).forEach((row: any) => {
        if (row.engineer_id) {
          engineerMap[row.engineer_id] = (engineerMap[row.engineer_id] || 0) + 1;
        }
      });
      const { data: engineerNames } = Object.keys(engineerMap).length
        ? await supabase.from('profiles').select('id, name').in('id', Object.keys(engineerMap))
        : { data: [] };
      const engineerNameMap = new Map((engineerNames ?? []).map((u: any) => [u.id, u.name]));
      const claimsByEngineer = Object.entries(engineerMap).map(([id, count]) => ({
        engineerName: engineerNameMap.get(id) ?? '—',
        count,
      }));

      const { data: claimUnitRows } = claimIds.length
        ? await supabase.from('claim_units').select('unit_id').in('claim_id', claimIds)
        : { data: [] };
      const unitCountMap: Record<number, number> = {};
      (claimUnitRows ?? []).forEach((row: any) => {
        unitCountMap[row.unit_id] = (unitCountMap[row.unit_id] || 0) + 1;
      });
      const unitIds = Object.keys(unitCountMap).map((v) => Number(v));
      const { data: unitNames } = unitIds.length
        ? await supabase.from('units').select('id, name').in('id', unitIds)
        : { data: [] };
      const unitNameMap = new Map((unitNames ?? []).map((u: any) => [u.id, u.name]));
      const claimsByUnit = unitIds.map((id) => ({
        unitName: unitNameMap.get(id) ?? `#${id}`,
        count: unitCountMap[id],
      }));

      const { data: defectRows } = await supabase
        .from('defects')
        .select('fixed_by')
        .eq('project_id', project.id);
      const defectEngineerMap: Record<string, number> = {};
      (defectRows ?? []).forEach((row: any) => {
        if (row.fixed_by) {
          defectEngineerMap[row.fixed_by] = (defectEngineerMap[row.fixed_by] || 0) + 1;
        }
      });
      const { data: defectEngineerNames } = Object.keys(defectEngineerMap).length
        ? await supabase.from('profiles').select('id, name').in('id', Object.keys(defectEngineerMap))
        : { data: [] };
      const defectEngineerNameMap = new Map((defectEngineerNames ?? []).map((u: any) => [u.id, u.name]));
      const defectsByEngineer = Object.entries(defectEngineerMap).map(([id, count]) => ({
        engineerName: defectEngineerNameMap.get(id) ?? '—',
        count,
      }));

      const projectStats: ProjectStats[] = [
        {
          projectId: project.id,
          projectName: project.name,
          unitCount: unitCount ?? 0,
          defectTotal: defectTotal ?? 0,
          letterCount: letterCount ?? 0,
        },
      ];

      return {
        projects: projectStats,
        claimsOpen: (claimsTotal ?? 0) - (claimsClosed ?? 0),
        claimsClosed: claimsClosed ?? 0,
        defectsOpen: (defectsTotal ?? 0) - (defectsClosed ?? 0),
        defectsClosed: defectsClosed ?? 0,
        courtCases: courtCases ?? 0,
        claimsByUnit,
        claimsByEngineer,
        defectsByEngineer,
      } as DashboardStats;
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
