import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import type { DefectRecord } from '@/shared/types/defect';

const TABLE = 'defects';

/** Получить все дефекты проекта */
export function useDefects() {
  const projectId = useProjectId();
  return useQuery<DefectRecord[]>({
    queryKey: [TABLE, projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, project_id, description, fix_cost, created_at')
        .eq('project_id', projectId)
        .order('id');
      if (error) throw error;
      return data as DefectRecord[];
    },
    staleTime: 5 * 60_000,
  });
}

/** Получить дефект по ID */
export function useDefect(id?: number) {
  const projectId = useProjectId();
  return useQuery<DefectRecord | null>({
    queryKey: ['defect', id],
    enabled: !!id && !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, project_id, description, fix_cost, created_at')
        .eq('id', id as number)
        .eq('project_id', projectId)
        .single();
      if (error) throw error;
      return data as DefectRecord;
    },
    staleTime: 5 * 60_000,
  });
}
