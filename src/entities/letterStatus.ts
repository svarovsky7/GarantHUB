import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { LetterStatus } from '@/shared/types/letterStatus';

const TABLE = 'letter_statuses';
const KEY = [TABLE];

export const useLetterStatuses = () =>
  useQuery<LetterStatus[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name, color')
        .order('id');
      if (error) throw error;
      return (data ?? []) as LetterStatus[];
    },
    staleTime: 5 * 60_000,
  });

const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: KEY });

export const useAddLetterStatus = () => {
  const qc = useQueryClient();
  return useMutation<LetterStatus, Error, Omit<LetterStatus, 'id'>>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select('id, name, color')
        .single();
      if (error) throw error;
      return data as LetterStatus;
    },
    onSuccess: () => invalidate(qc),
  });
};

export const useUpdateLetterStatus = () => {
  const qc = useQueryClient();
  return useMutation<LetterStatus, Error, { id: number; updates: Partial<Omit<LetterStatus, 'id'>> }>({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(updates)
        .eq('id', id)
        .select('id, name, color')
        .single();
      if (error) throw error;
      return data as LetterStatus;
    },
    onSuccess: () => invalidate(qc),
  });
};

export const useDeleteLetterStatus = () => {
  const qc = useQueryClient();
  return useMutation<number, Error, number>({
    mutationFn: async (id) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => invalidate(qc),
  });
};
