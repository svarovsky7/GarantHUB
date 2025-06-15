import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useNotify } from '@/shared/hooks/useNotify';
import type { DefectRecord } from '@/shared/types/defect';

export interface NewDefect {
  description: string;
  defect_type_id: number | null;
  defect_status_id: number | null;
  brigade_id: number | null;
  contractor_id: number | null;
  received_at: string | null;
  fixed_at: string | null;
}

const TABLE = 'defects';

/** Получить все дефекты проекта */
export function useDefects() {
  return useQuery<DefectRecord[]>({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          'id, description, defect_type_id, defect_status_id, brigade_id, contractor_id, received_at, fixed_at, created_at,' +
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
          'id, description, defect_type_id, defect_status_id, brigade_id, contractor_id, received_at, fixed_at, created_at,' +
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

/** Создать несколько дефектов и вернуть их ID */
export function useCreateDefects() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<number[], Error, NewDefect[]>({
    async mutationFn(defects) {
      if (!defects.length) return [];
      const { data, error } = await supabase
        .from(TABLE)
        .insert(defects)
        .select('id');
      if (error) throw error;
      return (data as { id: number }[]).map((d) => d.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
    onError: (e) => notify.error(e.message),
  });
}

/** Удалить дефект */
export function useDeleteDefect() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<number, Error, number>({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
    onError: (e) => notify.error(e.message),
  });
}
