import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { SortDirection } from '@/shared/types/sortDirection';
import type { UnitSortOrder } from '@/shared/types/unitSortOrder';

const TABLE = 'unit_sort_orders';

/**
 * Загрузка настроек сортировки объектов по этажам.
 */
export const useUnitSortOrders = (projectId?: number | null, building?: string | null) =>
  useQuery<Record<string, SortDirection>>({
    queryKey: [TABLE, projectId, building],
    enabled: !!projectId,
    queryFn: async () => {
      if (!projectId) return {};
      let query = supabase
        .from(TABLE)
        .select('floor, sort_direction')
        .eq('project_id', projectId);
      if (building) query = query.eq('building', building);
      const { data, error } = await query;
      if (error) throw error;
      const map: Record<string, SortDirection> = {};
      (data ?? []).forEach((row: any) => {
        if (row.sort_direction) map[row.floor] = row.sort_direction as SortDirection;
      });
      return map;
    },
    staleTime: 5 * 60_000,
  });

/**
 * Сохранить направление сортировки для этажа.
 */
export const useUpsertUnitSortOrder = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, UnitSortOrder>({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from(TABLE)
        .upsert(payload, { onConflict: 'project_id,building,floor' });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [TABLE, vars.project_id, vars.building] });
    },
  });
};
