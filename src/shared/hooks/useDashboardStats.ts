import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { useVisibleProjects } from '@/entities/project';
import { useClaimStatuses } from '@/entities/claimStatus';
import { useDefectStatuses } from '@/entities/defectStatus';
import type { DashboardStats, ProjectStats } from '@/shared/types/dashboardStats';

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
    queryFn: async () => {
      const projectStats: ProjectStats[] = [];
      for (const p of projects) {
        const [{ count: unitCount }, { count: defectTotal }, { count: letterCount }] = await Promise.all([
          supabase.from('units').select('id', { count: 'exact', head: true }).eq('project_id', p.id),
          supabase.from('defects').select('id', { count: 'exact', head: true }).eq('project_id', p.id),
          supabase.from('letters').select('id', { count: 'exact', head: true }).eq('project_id', p.id),
        ]);
        projectStats.push({
          projectId: p.id,
          projectName: p.name,
          unitCount: unitCount ?? 0,
          defectTotal: defectTotal ?? 0,
          letterCount: letterCount ?? 0,
        });
      }

      const claimsQuery = supabase
        .from('claims')
        .select('id, engineer_id')
        .in('project_id', projectIds);

      const [{ count: claimsTotal }, { count: claimsClosed }, { count: defectsTotal }, { count: defectsClosed }, { count: courtCases }, { data: claimsRows }] = await Promise.all([
        supabase.from('claims').select('id', { count: 'exact', head: true }).in('project_id', projectIds),
        closedClaimId
          ? supabase
              .from('claims')
              .select('id', { count: 'exact', head: true })
              .in('project_id', projectIds)
              .eq('claim_status_id', closedClaimId)
          : Promise.resolve({ count: 0 }),
        supabase.from('defects').select('id', { count: 'exact', head: true }).in('project_id', projectIds),
        closedDefectId
          ? supabase
              .from('defects')
              .select('id', { count: 'exact', head: true })
              .in('project_id', projectIds)
              .eq('status_id', closedDefectId)
          : Promise.resolve({ count: 0 }),
        supabase.from('court_cases').select('id', { count: 'exact', head: true }).in('project_id', projectIds),
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
        ? await supabase
            .from('profiles')
            .select('id, name')
            .in('id', Object.keys(engineerMap))
        : { data: [] };
      const engineerNameMap = new Map(
        (engineerNames ?? []).map((u: any) => [u.id, u.name]),
      );
      const claimsByEngineer = Object.entries(engineerMap).map(([id, count]) => ({
        engineerName: engineerNameMap.get(id) ?? '—',
        count,
      }));

      const { data: claimUnitRows } = claimIds.length
        ? await supabase
            .from('claim_units')
            .select('unit_id')
            .in('claim_id', claimIds)
        : { data: [] };
      const unitCountMap: Record<number, number> = {};
      (claimUnitRows ?? []).forEach((row: any) => {
        unitCountMap[row.unit_id] = (unitCountMap[row.unit_id] || 0) + 1;
      });
      const unitIds = Object.keys(unitCountMap).map((v) => Number(v));
      const { data: unitNames } = unitIds.length
        ? await supabase
            .from('units')
            .select('id, name')
            .in('id', unitIds)
        : { data: [] };
      const unitNameMap = new Map((unitNames ?? []).map((u: any) => [u.id, u.name]));
      const claimsByUnit = unitIds.map((id) => ({
        unitName: unitNameMap.get(id) ?? `#${id}`,
        count: unitCountMap[id],
      }));

      const { data: defectRows } = await supabase
        .from('defects')
        .select('fixed_by')
        .in('project_id', projectIds);
      const defectEngineerMap: Record<string, number> = {};
      (defectRows ?? []).forEach((row: any) => {
        if (row.fixed_by) {
          defectEngineerMap[row.fixed_by] = (defectEngineerMap[row.fixed_by] || 0) + 1;
        }
      });
      const { data: defectEngineerNames } = Object.keys(defectEngineerMap).length
        ? await supabase
            .from('profiles')
            .select('id, name')
            .in('id', Object.keys(defectEngineerMap))
        : { data: [] };
      const defectEngineerNameMap = new Map(
        (defectEngineerNames ?? []).map((u: any) => [u.id, u.name]),
      );
      const defectsByEngineer = Object.entries(defectEngineerMap).map(
        ([id, count]) => ({
          engineerName: defectEngineerNameMap.get(id) ?? '—',
          count,
        }),
      );

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
