import { supabase } from '@/shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClaimStatus } from '@/shared/types/claimStatus';

const TABLE = 'claim_statuses';

export const useClaimStatuses = () => {
  return useQuery({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLE).select('*').order('id');
      if (error) throw error;
      return data as ClaimStatus[];
    },
    staleTime: 5 * 60_000,
  });
};

export const useUpdateClaimStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ClaimStatus>; }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data as ClaimStatus;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};
