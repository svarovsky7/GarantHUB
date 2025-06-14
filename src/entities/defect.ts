import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { DefectRecord, NewDefect } from '@/shared/types/defect';

const TABLE = 'defects';

/** Получить все дефекты проекта */
export function useDefects() {
  return useQuery<DefectRecord[]>({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          'id, description, defect_type_id, defect_status_id, received_at, created_at,' +
          ' defect_type:defect_types(id,name), defect_status:defect_statuses(id,name)'
        )
        .order('id');
      if (error) throw error;
      return data as DefectRecord[];
    },
    staleTime: 5 * 60_000,
  });
}

/** Получить дефект по ID */
export function useDefect(id?: number) {
  return useQuery<DefectRecord | null>({
    queryKey: ['defect', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          'id, description, defect_type_id, defect_status_id, received_at, created_at,' +
          ' defect_type:defect_types(id,name), defect_status:defect_statuses(id,name)'
        )
        .eq('id', id as number)
        .single();
      if (error) throw error;
      return data as DefectRecord;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Создать несколько дефектов.
 * Возвращает массив идентификаторов созданных записей.
 */
export function useAddDefects() {
  const qc = useQueryClient();
  return useMutation<number[], Error, NewDefect[]>({
    mutationFn: async (rows) => {
      if (!rows.length) return [];
      const { data, error } = await supabase
        .from(TABLE)
        .insert(rows)
        .select('id');
      if (error) throw error;
      return (data ?? []).map((r) => r.id as number);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
}
