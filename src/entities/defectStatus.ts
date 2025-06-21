import { supabase } from '@/shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DefectStatus } from '@/shared/types/defectStatus';

const TABLE = 'defect_statuses';

export const useDefectStatuses = () =>
  useQuery<DefectStatus[]>({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name, color')
        .order('id');
      if (error) throw error;
      return (data ?? []) as unknown as DefectStatus[];
    },
    staleTime: 5 * 60_000,
  });

export const useAddDefectStatus = () => {
  const qc = useQueryClient();
  return useMutation<DefectStatus, Error, Omit<DefectStatus, 'id'>>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select('id, name, color')
        .single();
      if (error) throw error;
      return data as unknown as DefectStatus;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};

export const useUpdateDefectStatus = () => {
  const qc = useQueryClient();
  return useMutation<DefectStatus, Error, { id: number; updates: Partial<DefectStatus> }>({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(updates)
        .eq('id', id)
        .select('id, name, color')
        .single();
      if (error) throw error;
      return data as unknown as DefectStatus;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};

export const useDeleteDefectStatus = () => {
  const qc = useQueryClient();
  return useMutation<number, Error, number>({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};
