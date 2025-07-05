import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { CourtCaseClaimLink } from '@/shared/types/courtCaseClaimLink';

const TABLE = 'court_case_claim_links';

export function useCaseClaimLinks(caseId?: number | null) {
  return useQuery({
    queryKey: [TABLE, caseId],
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, case_id, claim_id, created_at')
        .eq('case_id', caseId as number);
      if (error) throw error;
      return (data ?? []) as CourtCaseClaimLink[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useAddCaseClaimLinks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      rows: Omit<CourtCaseClaimLink, 'id' | 'created_at'>[],
    ) => {
      if (!rows.length) return [] as CourtCaseClaimLink[];
      const { data, error } = await supabase
        .from(TABLE)
        .insert(rows)
        .select('id, case_id, claim_id, created_at');
      if (error) throw error;
      return (data ?? []) as CourtCaseClaimLink[];
    },
    onSuccess: (rows) => {
      if (rows.length) {
        qc.invalidateQueries({ queryKey: [TABLE, rows[0].case_id] });
      }
    },
  });
}

export function useDeleteCaseClaimLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('case_id')
        .eq('id', id)
        .single();
      if (error) throw error;
      const caseId = data.case_id as number;
      const { error: delErr } = await supabase.from(TABLE).delete().eq('id', id);
      if (delErr) throw delErr;
      return caseId;
    },
    onSuccess: (caseId) =>
      qc.invalidateQueries({ queryKey: [TABLE, caseId] }),
  });
}
