import { supabase } from '@/shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Status } from '@/shared/types/status';

/**
 * Базовые CRUD-хуки для справочника статусов различных сущностей.
 * @param entity тип сущности: 'ticket', 'defect', 'claim' и т.д.
 */
export const useStatuses = <T extends Status = Status>(entity: string) =>
  useQuery<T[]>({
    queryKey: ['statuses', entity],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('statuses')
        .select('id, entity, name, color')
        .eq('entity', entity)
        .order('id');
      if (error) throw error;
      return (data ?? []) as T[];
    },
    staleTime: 5 * 60_000,
  });

export const useAddStatus = <T extends Status = Status>(entity: string) => {
  const qc = useQueryClient();
  return useMutation<T, Error, Omit<T, 'id' | 'entity'>>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('statuses')
        .insert({ ...payload, entity })
        .select('id, entity, name, color')
        .single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['statuses', entity] }),
  });
};

export const useUpdateStatus = <T extends Status = Status>(entity: string) => {
  const qc = useQueryClient();
  return useMutation<T, Error, { id: number; updates: Partial<Omit<T, 'id' | 'entity'>> }>({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('statuses')
        .update(updates)
        .eq('id', id)
        .eq('entity', entity)
        .select('id, entity, name, color')
        .single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['statuses', entity] }),
  });
};

export const useDeleteStatus = (entity: string) => {
  const qc = useQueryClient();
  return useMutation<number, Error, number>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('statuses')
        .delete()
        .eq('id', id)
        .eq('entity', entity);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['statuses', entity] }),
  });
};
