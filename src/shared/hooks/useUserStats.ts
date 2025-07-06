import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { fetchPaged } from '@/shared/api/fetchAll';
import { useClaimStatuses } from '@/entities/claimStatus';
import { useDefectStatuses } from '@/entities/defectStatus';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';
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
  const { data: caseStatuses = [] } = useCourtCaseStatuses();
  const qc = useQueryClient();

  const from = period?.[0] ?? null;
  const to = period?.[1] ?? null;

  const query = useQuery<UserStats>({
    queryKey: ['user-stats', userId, from, to],
    enabled: !!userId && !!from && !!to,
    queryFn: async () => {
      const [claimRows, defectRows, claimRespRows, defectRespRows, caseRows, caseRespRows] = await Promise.all([
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
            .from('claims')
            .select('id, claim_status_id, created_at')
            .eq('engineer_id', userId as string)
            .gte('created_at', from as string)
            .lte('created_at', to as string)
            .order('id')
            .range(f, t),
        ),
        fetchPaged<any>((f, t) =>
          supabase
            .from('defects')
            .select('id, status_id, created_at')
            .eq('engineer_id', userId as string)
            .gte('created_at', from as string)
            .lte('created_at', to as string)
            .order('id')
            .range(f, t),
        ),
        fetchPaged<any>((f, t) =>
          supabase
            .from('court_cases')
            .select('id, status, created_at')
            .eq('created_by', userId as string)
            .gte('created_at', from as string)
            .lte('created_at', to as string)
            .order('id')
            .range(f, t),
        ),
        fetchPaged<any>((f, t) =>
          supabase
            .from('court_cases')
            .select('id, status, created_at')
            .eq('responsible_lawyer_id', userId as string)
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
      const claimRespMap: Record<string, number> = {};
      claimRows.forEach((r: any) => {
        const id = r.claim_status_id ?? 'null';
        claimMap[id] = (claimMap[id] || 0) + 1;
      });
      claimRespRows.forEach((r: any) => {
        const id = r.claim_status_id ?? 'null';
        claimRespMap[id] = (claimRespMap[id] || 0) + 1;
      });
      const defectMap: Record<string, number> = {};
      const defectRespMap: Record<string, number> = {};
      defectRows.forEach((r: any) => {
        const id = r.status_id ?? 'null';
        defectMap[id] = (defectMap[id] || 0) + 1;
      });
      defectRespRows.forEach((r: any) => {
        const id = r.status_id ?? 'null';
        defectRespMap[id] = (defectRespMap[id] || 0) + 1;
      });
      const caseRespMap: Record<string, number> = {};
      caseRespRows.forEach((r: any) => {
        const id = r.status ?? 'null';
        caseRespMap[id] = (caseRespMap[id] || 0) + 1;
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

      const claimResponsibleStatusCounts: StatusCount[] = Object.entries(
        claimRespMap,
      ).map(([id, count]) => ({
        statusId: id === 'null' ? null : Number(id),
        statusName:
          id === 'null'
            ? null
            : claimStatuses.find((s) => s.id === Number(id))?.name ?? null,
        count,
      }));

      const defectResponsibleStatusCounts: StatusCount[] = Object.entries(
        defectRespMap,
      ).map(([id, count]) => ({
        statusId: id === 'null' ? null : Number(id),
        statusName:
          id === 'null'
            ? null
            : defectStatuses.find((s) => s.id === Number(id))?.name ?? null,
        count,
      }));

      const courtCaseStatusCounts: StatusCount[] = Object.entries(
        caseRespMap,
      ).map(([id, count]) => ({
        statusId: id === 'null' ? null : Number(id),
        statusName:
          id === 'null'
            ? null
            : caseStatuses.find((s) => s.id === Number(id))?.name ?? null,
        count,
      }));

      return {
        claimCount: claimRows.length,
        defectCount: defectRows.length,
        claimResponsibleCount: claimRespRows.length,
        defectResponsibleCount: defectRespRows.length,
        courtCaseCount: caseRows.length,
        courtCaseResponsibleCount: caseRespRows.length,
        claimStatusCounts,
        claimResponsibleStatusCounts,
        defectStatusCounts,
        defectResponsibleStatusCounts,
        courtCaseStatusCounts,
      } as UserStats;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!userId) return;
    const createdFilter = `created_by=eq.${userId}`;
    const engineerFilter = `engineer_id=eq.${userId}`;
    const lawyerFilter = `responsible_lawyer_id=eq.${userId}`;
    const key = ['user-stats', userId, from, to];
    const invalidate = () => qc.invalidateQueries({ queryKey: key });
    const channel = supabase
      .channel(`user-stats-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims', filter: createdFilter }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims', filter: engineerFilter }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'defects', filter: createdFilter }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'defects', filter: engineerFilter }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'court_cases', filter: createdFilter }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'court_cases', filter: lawyerFilter }, invalidate);
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [userId, from, to, qc]);

  return query;
}
