import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { fetchPaged } from '@/shared/api/fetchAll';
import { useClaimStatuses } from '@/entities/claimStatus';
import { useDefectStatuses } from '@/entities/defectStatus';
import type { UserStats, StatusCount } from '@/shared/types/userStats';

/**
 * Загружает статистику активности пользователя за выбранный период.
 * Подписывается на изменения в таблицах claims и defects.
 *
 * @param userId идентификатор пользователя
 * @param period массив из двух ISO-дат [from, to]
 */
export function useUserStats(
  userId?: string | null,
  period?: [string, string] | null,
) {
  const { data: claimStatuses = [] } = useClaimStatuses();
  const { data: defectStatuses = [] } = useDefectStatuses();
  const qc = useQueryClient();

  const from = period?.[0] ?? null;
  const to = period?.[1] ?? null;

  const query = useQuery<UserStats>({
    queryKey: ['user-stats', userId, from, to],
    enabled: !!userId && !!from && !!to,
    queryFn: async () => {
      const [claimRows, defectRows] = await Promise.all([
        fetchPaged<any>((f, t) =>
          supabase
            .from('claims')
            .select('id, claim_status_id, created_at')
            .eq('created_by', userId as string)
            .gte('created_at', from as string)
            .lte('created_at', to as string)
            .order('id')
            .range(f, t),
        ),
        fetchPaged<any>((f, t) =>
          supabase
            .from('defects')
            .select('id, status_id, created_at')
            .eq('created_by', userId as string)
            .gte('created_at', from as string)
            .lte('created_at', to as string)
            .order('id')
            .range(f, t),
        ),
      ]);

      const claimMap: Record<string, number> = {};
      claimRows.forEach((r: any) => {
        const id = r.claim_status_id ?? 'null';
        claimMap[id] = (claimMap[id] || 0) + 1;
      });
      const defectMap: Record<string, number> = {};
      defectRows.forEach((r: any) => {
        const id = r.status_id ?? 'null';
        defectMap[id] = (defectMap[id] || 0) + 1;
      });

      const claimStatusCounts: StatusCount[] = Object.entries(claimMap).map(
        ([id, count]) => ({
          statusId: id === 'null' ? null : Number(id),
          statusName:
            id === 'null'
              ? null
              : claimStatuses.find((s) => s.id === Number(id))?.name ?? null,
          count,
        }),
      );

      const defectStatusCounts: StatusCount[] = Object.entries(defectMap).map(
        ([id, count]) => ({
          statusId: id === 'null' ? null : Number(id),
          statusName:
            id === 'null'
              ? null
              : defectStatuses.find((s) => s.id === Number(id))?.name ?? null,
          count,
        }),
      );

      return {
        claimCount: claimRows.length,
        defectCount: defectRows.length,
        claimStatusCounts,
        defectStatusCounts,
      } as UserStats;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!userId) return;
    const filter = `created_by=eq.${userId}`;
    const key = ['user-stats', userId, from, to];
    const invalidate = () => qc.invalidateQueries({ queryKey: key });
    const channel = supabase
      .channel(`user-stats-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims', filter }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'defects', filter }, invalidate);
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [userId, from, to, qc]);

  return query;
}
