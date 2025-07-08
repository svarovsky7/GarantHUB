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
        .eq('case_id', caseId as number)
        .order('id', { ascending: true });
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

export function useUpdateCaseClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<CourtCaseClaim> }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(updates)
        .eq('id', id)
        .select('id, case_id, claim_type_id, claimed_amount, confirmed_amount, paid_amount, agreed_amount')
        .single();
      if (error) throw error;
      return data as CourtCaseClaim;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: [TABLE, row.case_id] });
    },
  });
}

export function useDeleteCaseClaim() {
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
    onSuccess: (caseId) => qc.invalidateQueries({ queryKey: [TABLE, caseId] }),
  });
}
