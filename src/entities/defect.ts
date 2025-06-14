import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { DefectRecord } from '@/shared/types/defect';

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

/**
 * Создать несколько дефектов.
 * @param rows массив дефектов для вставки
 * @returns массив идентификаторов созданных записей
 */
export async function createDefects(
  rows: Array<Pick<
    DefectRecord,
    'description' | 'defect_type_id' | 'defect_status_id' | 'received_at'
  >>,
) {
  if (!rows.length) return [] as number[];
  const { data, error } = await supabase
    .from(TABLE)
    .insert(rows)
    .select('id');
  if (error) throw error;
  return (data ?? []).map((r) => r.id as number);
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
