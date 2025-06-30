import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { ClaimDefect } from '@/shared/types/claimDefect';

const TABLE = 'claim_defects';

export function useClaimDefects(defectIds?: number[]) {
  return useQuery<ClaimDefect[]>({
    queryKey: [TABLE, (defectIds ?? []).join(',')],
    enabled: Array.isArray(defectIds) && defectIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('claim_id, defect_id, pre_trial_claim')
        .in('defect_id', defectIds as number[]);
      if (error) throw error;
      return (data ?? []) as ClaimDefect[];
    },
    staleTime: 5 * 60_000,
  });
}
