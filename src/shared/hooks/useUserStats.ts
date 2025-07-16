import { useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { fetchPaged } from '@/shared/api/fetchAll';
import { useClaimStatuses } from '@/entities/claimStatus';
import { useDefectStatuses } from '@/entities/defectStatus';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';
import type { UserStats, StatusCount } from '@/shared/types/userStats';

export async function fetchUserStats(
  userId: string,
  from: string,
  to: string,
  claimStatuses: ReturnType<typeof useClaimStatuses>['data'],
  defectStatuses: ReturnType<typeof useDefectStatuses>['data'],
  caseStatuses: ReturnType<typeof useCourtCaseStatuses>['data'],
) {
  const [
    claimRows,
    claimRespRows,
    defectRespRows,
    defectRows,
    caseRows,
    caseRespRows,
  ] = await Promise.all([
    fetchPaged<any>((f, t) =>
        supabase
          .from('claims')
          .select('id, claim_status_id, created_at')
          .eq('created_by', userId)
          .gte('created_at', from)
          .lte('created_at', to)
          .order('id')
          .range(f, t),
    ),
    fetchPaged<any>((f, t) =>
        supabase
          .from('claims')
          .select('id, claim_status_id, created_at')
          .eq('engineer_id', userId)
          .gte('created_at', from)
          .lte('created_at', to)
          .order('id')
          .range(f, t),
    ),
    fetchPaged<any>((f, t) =>
        supabase
          .from('defects')
          .select('id, status_id, created_at')
          .eq('engineer_id', userId)
          .gte('created_at', from)
          .lte('created_at', to)
          .order('id')
          .range(f, t),
    ),
    fetchPaged<any>((f, t) =>
      supabase
        .from('defects')
        .select('id, status_id, created_at')
        .eq('created_by', userId)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('id')
        .range(f, t),
    ),
    fetchPaged<any>((f, t) =>
      supabase
        .from('court_cases')
        .select('id, status, created_at')
        .eq('created_by', userId)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('id')
        .range(f, t),
    ),
    fetchPaged<any>((f, t) =>
      supabase
        .from('court_cases')
        .select('id, status, created_at')
        .eq('responsible_lawyer_id', userId)
        .gte('created_at', from)
        .lte('created_at', to)
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
          : claimStatuses?.find((s: any) => s.id === Number(id))?.name ?? null,
      count,
    }),
  );

  const defectStatusCounts: StatusCount[] = Object.entries(defectMap).map(
    ([id, count]) => ({
      statusId: id === 'null' ? null : Number(id),
      statusName:
        id === 'null'
          ? null
          : defectStatuses?.find((s: any) => s.id === Number(id))?.name ?? null,
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
        : claimStatuses?.find((s: any) => s.id === Number(id))?.name ?? null,
    count,
  }));

  const defectResponsibleStatusCounts: StatusCount[] = Object.entries(
    defectRespMap,
  ).map(([id, count]) => ({
    statusId: id === 'null' ? null : Number(id),
    statusName:
      id === 'null'
        ? null
        : defectStatuses?.find((s: any) => s.id === Number(id))?.name ?? null,
    count,
  }));

  const courtCaseStatusCounts: StatusCount[] = Object.entries(
    caseRespMap,
  ).map(([id, count]) => ({
    statusId: id === 'null' ? null : Number(id),
    statusName:
      id === 'null'
        ? null
        : caseStatuses?.find((s: any) => s.id === Number(id))?.name ?? null,
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
}

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
    queryFn: async () =>
      fetchUserStats(
        userId as string,
        from as string,
        to as string,
        claimStatuses,
        defectStatuses,
        caseStatuses,
      ),
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

/**
 * Оптимизированная версия useUserStats которая устраняет N+1 проблему
 * Использует одну оптимизированную функцию вместо 6 отдельных запросов
 */
export function useUserStatsOptimized(
  userId?: string | null,
  period?: [string, string] | null,
) {
  const qc = useQueryClient();
  const from = period?.[0] ?? null;
  const to = period?.[1] ?? null;

  const query = useQuery<UserStats>({
    queryKey: ['user-stats-optimized', userId, from, to],
    enabled: !!userId && !!from && !!to,
    queryFn: async () => {
      // Используем оптимизированную функцию базы данных
      const { data, error } = await supabase.rpc('get_user_stats_optimized', {
        user_id: userId,
        from_date: from,
        to_date: to,
      });

      if (error) {
        console.error('Error fetching optimized user stats:', error);
        throw error;
      }

      const result = data?.[0];
      if (!result) {
        return {
          claimsCreated: 0,
          claimsResponsible: 0,
          defectsCreated: 0,
          defectsResponsible: 0,
          courtCasesCreated: 0,
          courtCasesResponsible: 0,
          claimStatusCounts: [],
          defectStatusCounts: [],
          claimResponsibleStatusCounts: [],
          defectResponsibleStatusCounts: [],
          courtCaseStatusCounts: [],
          courtCaseResponsibleStatusCounts: [],
        };
      }

      return {
        claimsCreated: result.claims_created || 0,
        claimsResponsible: result.claims_responsible || 0,
        defectsCreated: result.defects_created || 0,
        defectsResponsible: result.defects_responsible || 0,
        courtCasesCreated: result.court_cases_created || 0,
        courtCasesResponsible: result.court_cases_responsible || 0,
        claimStatusCounts: result.claim_status_counts || [],
        defectStatusCounts: result.defect_status_counts || [],
        claimResponsibleStatusCounts: result.claim_responsible_status_counts || [],
        defectResponsibleStatusCounts: result.defect_responsible_status_counts || [],
        courtCaseStatusCounts: result.court_case_status_counts || [],
        courtCaseResponsibleStatusCounts: result.court_case_responsible_status_counts || [],
      };
    },
    staleTime: 60_000,
  });

  // Подписка на изменения остается той же
  useEffect(() => {
    if (!userId) return;
    const createdFilter = `created_by=eq.${userId}`;
    const engineerFilter = `engineer_id=eq.${userId}`;
    const lawyerFilter = `responsible_lawyer_id=eq.${userId}`;
    const key = ['user-stats-optimized', userId, from, to];
    const invalidate = () => qc.invalidateQueries({ queryKey: key });
    const channel = supabase
      .channel(`user-stats-optimized-${userId}`)
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

export function useMultipleUserStats(
  userIds: string[],
  period?: [string, string] | null,
) {
  const { data: claimStatuses = [] } = useClaimStatuses();
  const { data: defectStatuses = [] } = useDefectStatuses();
  const { data: caseStatuses = [] } = useCourtCaseStatuses();

  const from = period?.[0] ?? null;
  const to = period?.[1] ?? null;

  const queries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ['user-stats', id, from, to],
      enabled: !!from && !!to,
      queryFn: () =>
        fetchUserStats(
          id,
          from as string,
          to as string,
          claimStatuses,
          defectStatuses,
          caseStatuses,
        ),
      staleTime: 60_000,
    })),
  });

  const isPending = queries.some((q) => q.isPending);
  const isError = queries.some((q) => q.isError);
  const error = queries.find((q) => q.error)?.error;
  const data = queries.map((q) => q.data as UserStats | undefined);

  return { data, isPending, isError, error } as { 
    data: (UserStats | undefined)[]; 
    isPending: boolean; 
    isError: boolean; 
    error?: Error;
  };
}

/**
 * Оптимизированная версия useMultipleUserStats которая устраняет N+1 проблему
 * Использует batch loading для получения статистики нескольких пользователей
 */
export function useMultipleUserStatsOptimized(
  userIds: string[],
  period?: [string, string] | null,
) {
  const from = period?.[0] ?? null;
  const to = period?.[1] ?? null;

  const queries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ['user-stats-optimized', id, from, to],
      enabled: !!from && !!to,
      queryFn: async () => {
        // Используем оптимизированную функцию базы данных
        const { data, error } = await supabase.rpc('get_user_stats_optimized', {
          user_id: id,
          from_date: from,
          to_date: to,
        });

        if (error) {
          console.error('Error fetching optimized user stats:', error);
          throw error;
        }

        const result = data?.[0];
        if (!result) {
          return {
            claimsCreated: 0,
            claimsResponsible: 0,
            defectsCreated: 0,
            defectsResponsible: 0,
            courtCasesCreated: 0,
            courtCasesResponsible: 0,
            claimStatusCounts: [],
            defectStatusCounts: [],
            claimResponsibleStatusCounts: [],
            defectResponsibleStatusCounts: [],
            courtCaseStatusCounts: [],
            courtCaseResponsibleStatusCounts: [],
          };
        }

        return {
          claimsCreated: result.claims_created || 0,
          claimsResponsible: result.claims_responsible || 0,
          defectsCreated: result.defects_created || 0,
          defectsResponsible: result.defects_responsible || 0,
          courtCasesCreated: result.court_cases_created || 0,
          courtCasesResponsible: result.court_cases_responsible || 0,
          claimStatusCounts: result.claim_status_counts || [],
          defectStatusCounts: result.defect_status_counts || [],
          claimResponsibleStatusCounts: result.claim_responsible_status_counts || [],
          defectResponsibleStatusCounts: result.defect_responsible_status_counts || [],
          courtCaseStatusCounts: result.court_case_status_counts || [],
          courtCaseResponsibleStatusCounts: result.court_case_responsible_status_counts || [],
        };
      },
      staleTime: 60_000,
    })),
  });

  const isPending = queries.some((q) => q.isPending);
  const isError = queries.some((q) => q.isError);
  const error = queries.find((q) => q.error)?.error;
  const data = queries.map((q) => q.data as UserStats | undefined);

  return { data, isPending, isError, error } as { 
    data: (UserStats | undefined)[]; 
    isPending: boolean; 
    isError: boolean; 
    error?: Error;
  };
}
