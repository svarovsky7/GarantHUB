import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { HistoryEvent, HistoryEventWithUser } from '@/shared/types/history';

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
      const events = (data ?? []) as HistoryEvent[];

      const ids = Array.from(
        new Set(events.map((e) => e.changed_by).filter(Boolean)),
      ) as string[];
      let userMap: Record<string, string> = {};
      if (ids.length) {
        const { data: users, error: uErr } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', ids);
        if (uErr) throw uErr;
        userMap = Object.fromEntries(
          (users ?? []).map((u: { id: string; name: string }) => [u.id, u.name]),
        );
      }

      return events.map((e) => ({
        ...e,
        user_name: userMap[e.changed_by as string] ?? null,
      })) as HistoryEventWithUser[];
    },
    staleTime: 60_000,
  });
}
