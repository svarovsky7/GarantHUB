import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { HistoryEvent } from '@/shared/types/history';

const TABLE = 'unit_history';

/** Получить историю изменений по объекту */
export function useUnitHistory(unitId?: number) {
  return useQuery({
    queryKey: [TABLE, unitId],
    enabled: !!unitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('unit_id', unitId)
        .order('changed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as HistoryEvent[];
    },
    staleTime: 60_000,
  });
}
