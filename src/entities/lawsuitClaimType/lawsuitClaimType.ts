import { supabase } from '@/shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LawsuitClaimType } from '@/shared/types/lawsuitClaimType';

const TABLE = 'lawsuit_claim_types';
const KEY = [TABLE];

export const useLawsuitClaimTypes = () =>
  useQuery<LawsuitClaimType[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name')
        .order('id');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: KEY });

export const useAddLawsuitClaimType = () => {
  const qc = useQueryClient();
  return useMutation<LawsuitClaimType, Error, string>({
    mutationFn: async (name: string): Promise<LawsuitClaimType> => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ name })
        .select('id, name')
        .single();
      if (error) throw error;
      return data as LawsuitClaimType;
    },
    onSuccess: () => invalidate(qc),
  });
};

export const useUpdateLawsuitClaimType = () => {
  const qc = useQueryClient();
  return useMutation<LawsuitClaimType, Error, { id: number; name: string }>({
    mutationFn: async ({ id, name }): Promise<LawsuitClaimType> => {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ name })
        .eq('id', id)
        .select('id, name')
        .single();
      if (error) throw error;
      return data as LawsuitClaimType;
    },
    onSuccess: () => invalidate(qc),
  });
};

export const useDeleteLawsuitClaimType = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id: number): Promise<void> => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
};
