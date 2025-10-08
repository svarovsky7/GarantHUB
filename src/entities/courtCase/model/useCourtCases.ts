import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import type { CourtCase } from '@/shared/types/courtCase';
import { getAttachmentsByIds } from '@/entities/attachment';

const CASES_TABLE = 'court_cases';
const CASE_UNITS_TABLE = 'court_case_units';
const CASE_LINKS_TABLE = 'court_case_links';
const CASE_ATTACH_TABLE = 'court_case_attachments';

/**
 * @deprecated Используйте useCourtCasesSummary для более быстрой работы
 */
export function useCourtCases() {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  return useQuery({
    queryKey: [CASES_TABLE, projectId, projectIds.join(',')],
    queryFn: async () => {
      let query = supabase
        .from(CASES_TABLE)
        .select('*, court_cases_uids(id, uid)');
      if (onlyAssigned) {
        query = query.in('project_id', projectIds.length ? projectIds : [-1]);
      }
      // Sort cases by ID in descending order for consistent latest-first view
      query = query.order('id', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;

      const ids = (data ?? []).map((r: any) => r.id);
      const { data: unitRows } = ids.length
        ? await supabase
            .from(CASE_UNITS_TABLE)
            .select('court_case_id, unit_id')
            .in('court_case_id', ids)
        : { data: [] };
      const unitMap = new Map<number, number[]>();
      (unitRows ?? []).forEach((r: any) => {
        const arr = unitMap.get(r.court_case_id) || [];
        arr.push(r.unit_id);
        unitMap.set(r.court_case_id, arr);
      });

      const { data: links, error: linkErr } = await supabase
        .from(CASE_LINKS_TABLE)
        .select('parent_id, child_id');
      if (linkErr) throw linkErr;
      const linkMap = new Map<number, number>();
      (links ?? []).forEach((l) => linkMap.set(l.child_id, l.parent_id));

      return (data ?? []).map((row: any) => ({
        ...row,
        unit_ids: unitMap.get(row.id) || [],
        parent_id: linkMap.get(row.id) ?? null,
        total_claim_amount: row.total_claim_amount || 0,
        caseUid: row.court_cases_uids?.uid ?? null,
      })) as CourtCase[];
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить детальную информацию о судебном деле по ID.
 */
export function useCourtCase(caseId: number | string | undefined) {
  const id = Number(caseId);
  return useQuery({
    queryKey: ['court_case', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(CASES_TABLE)
        .select('*, court_cases_uids(id, uid)')
        .eq('id', id)
        .single();
      if (error) throw error;

      const { data: unitRows } = await supabase
        .from(CASE_UNITS_TABLE)
        .select('unit_id')
        .eq('court_case_id', id);
      const unitIds = (unitRows ?? []).map((r: any) => r.unit_id);

      const { data: attachRows } = await supabase
        .from(CASE_ATTACH_TABLE)
        .select('attachment_id')
        .eq('court_case_id', id);
      const attIds = (attachRows ?? []).map((r: any) => r.attachment_id);
      let attachments: any[] = [];
      if (attIds.length) {
        const files = await getAttachmentsByIds(attIds);
        attachments = files;
      }
      const result = {
        ...(data as any),
        unit_ids: unitIds,
        attachment_ids: attIds,
        attachments,
        caseUid: (data as any).court_cases_uids?.uid ?? null,
      } as CourtCase & { attachments: any[] };
      return result;
    },
    staleTime: 5 * 60_000,
  });
}
