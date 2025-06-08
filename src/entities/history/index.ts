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

      const mapped = events.map((e) => ({
        ...e,
        user_name: userMap[e.changed_by as string] ?? null,
      })) as HistoryEventWithUser[];

      // Skip immediate updates right after creation
      const asc = [...mapped].sort(
        (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime(),
      );
      const creationMap = new Map<string, number>();
      const filtered: HistoryEventWithUser[] = [];
      for (const ev of asc) {
        const key = `${ev.entity_type}:${ev.entity_id}`;
        if (ev.action === 'created') {
          creationMap.set(key, new Date(ev.changed_at).getTime());
          filtered.push(ev);
        } else if (ev.action === 'updated') {
          const t = creationMap.get(key);
          if (t && Math.abs(new Date(ev.changed_at).getTime() - t) < 10000) {
            continue;
          }
          filtered.push(ev);
        } else {
          filtered.push(ev);
        }
      }
      return filtered.sort(
        (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime(),
      );
    },
    staleTime: 60_000,
  });
}
