import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { CourtCaseClaim } from '@/shared/types/courtCaseClaim';

const TABLE = 'court_case_claims';

export function useCaseClaims(caseId?: number | null) {
  return useQuery({
    queryKey: [TABLE, caseId],
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          'id, case_id, claim_type_id, claimed_amount, confirmed_amount, paid_amount, agreed_amount'
        )
        .eq('case_id', caseId as number);
      if (error) throw error;
      return (data ?? []) as CourtCaseClaim[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useAddCaseClaims() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Omit<CourtCaseClaim, 'id'>[]) => {
      if (!rows.length) return [] as CourtCaseClaim[];
      const { data, error } = await supabase
        .from(TABLE)
        .insert(rows)
        .select('id, case_id, claim_type_id, claimed_amount, confirmed_amount, paid_amount, agreed_amount');
      if (error) throw error;
      return (data ?? []) as CourtCaseClaim[];
    },
    onSuccess: (rows) => {
      if (rows.length) {
        qc.invalidateQueries({ queryKey: [TABLE, rows[0].case_id] });
      }
    },
  });
}
