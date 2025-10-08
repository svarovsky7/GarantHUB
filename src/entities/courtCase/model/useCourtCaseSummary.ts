import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import type { CourtCaseSummary } from '@/shared/types/courtCaseSummary';
import { fetchPaged, fetchByChunks } from '@/shared/api/fetchAll';
import { mapCourtCaseSummary } from '../lib/courtCaseTransformers';

const CASES_SUMMARY_TABLE = 'court_cases_summary';
const CASE_UNITS_TABLE = 'court_case_units';
const CASE_LINKS_TABLE = 'court_case_links';

/**
 * Хук получения списка судебных дел с использованием представления court_cases_summary (оптимизированный).
 */
export function useCourtCasesSummary() {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  return useQuery({
    queryKey: [CASES_SUMMARY_TABLE, projectId, projectIds.join(',')],
    queryFn: async () => {
      const rows = await fetchPaged<CourtCaseSummary>((from, to) => {
        let q: any = supabase
          .from(CASES_SUMMARY_TABLE)
          .select('*');
        if (onlyAssigned) {
          q = q.in('project_id', projectIds.length ? projectIds : [-1]);
        }
        q = q.order('id', { ascending: false }).range(from, to);
        return q;
      });

      const ids = rows.map((r: CourtCaseSummary) => r.id);

      // Получаем unit_ids для дел
      const unitRows = ids.length
        ? await fetchByChunks(ids, (chunk) =>
            supabase.from(CASE_UNITS_TABLE).select('court_case_id, unit_id').in('court_case_id', chunk),
          )
        : [];
      const unitMap: Record<number, number[]> = {};
      (unitRows ?? []).forEach((u: any) => {
        if (!unitMap[u.court_case_id]) unitMap[u.court_case_id] = [];
        unitMap[u.court_case_id].push(u.unit_id);
      });

      // Получаем связи дел
      const { data: links } = await supabase
        .from(CASE_LINKS_TABLE)
        .select('parent_id, child_id');
      const linkMap = new Map<number, number>();
      (links ?? []).forEach((l: any) => linkMap.set(l.child_id, l.parent_id));

      return (rows ?? []).map((r: CourtCaseSummary) => {
        const mapped = mapCourtCaseSummary(r);
        mapped.unit_ids = unitMap[r.id] ?? [];
        // Добавляем parent_id для совместимости с существующим типом CourtCase
        (mapped as any).parent_id = linkMap.get(r.id) ?? null;
        return mapped;
      });
    },
    staleTime: 5 * 60_000,
  });
}
