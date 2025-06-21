import { supabase } from '@/shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClaimStatus } from '@/shared/types/claimStatus';

const TABLE = 'claim_statuses';

/**
 * Хук получения списка статусов претензии.
 */
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

/**
 * Хук обновления статуса претензии.
 */
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

/**
 * Хук добавления статуса претензии.
 */
export const useAddClaimStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Omit<ClaimStatus, 'id'>) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(values)
        .select('*')
        .single();
      if (error) throw error;
      return data as ClaimStatus;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};

/**
 * Хук удаления статуса претензии.
 */
export const useDeleteClaimStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};
