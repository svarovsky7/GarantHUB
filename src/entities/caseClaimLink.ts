import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { CaseClaimLink } from '@/shared/types/caseClaimLink';

const TABLE = 'court_case_claim_links';

export function useCaseClaimLinks(caseId?: number | null) {
  return useQuery({
    queryKey: [TABLE, caseId],
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, case_id, claim_id')
        .eq('case_id', caseId as number);
      if (error) throw error;
      return (data ?? []) as CaseClaimLink[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useLinkCaseClaims() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, claimIds }: { caseId: number; claimIds: number[] }) => {
      if (claimIds.length === 0) return;
      const rows = claimIds.map((claim_id) => ({ case_id: caseId, claim_id }));
      const { error } = await supabase.from(TABLE).insert(rows);
      if (error) throw error;
      return { caseId };
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [TABLE, vars.caseId] });
    },
  });
}

export function useUnlinkCaseClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ caseId, claimId }: { caseId: number; claimId: number }) => {
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('case_id', caseId)
        .eq('claim_id', claimId);
      if (error) throw error;
      return { caseId };
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [TABLE, vars.caseId] });
    },
  });
}
