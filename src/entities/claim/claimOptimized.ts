import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import type { ClaimSummary } from '@/shared/types/claimSummary';
import dayjs from 'dayjs';

/**
 * Оптимизированный хук для получения претензий с связанными данными
 * Решает N+1 проблему используя CTE и JSON агрегацию
 */
export function useClaimsSummaryOptimized() {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();

  return useQuery({
    queryKey: ['claims-optimized', projectId, projectIds.join(',')],
    queryFn: async () => {
      // Оптимизированный запрос с CTE и JSON агрегацией
      const { data, error } = await supabase.rpc('get_claims_with_relations', {
        project_ids: projectIds.length ? projectIds : null,
        only_assigned: onlyAssigned,
      });

      if (error) {
        console.error('Error fetching optimized claims:', error);
        throw error;
      }

      return data?.map((row: any) => ({
        ...row,
        // Преобразуем строковые даты в объекты Dayjs
        claimedOn: row.claimed_on ? dayjs(row.claimed_on) : null,
        acceptedOn: row.accepted_on ? dayjs(row.accepted_on) : null,
        registeredOn: row.registered_on ? dayjs(row.registered_on) : null,
        resolvedOn: row.resolved_on ? dayjs(row.resolved_on) : null,
        createdAt: row.created_at ? dayjs(row.created_at) : null,
        // Парсим JSON массивы
        unit_ids: row.unit_ids || [],
        defect_ids: row.defect_ids || [],
        // Алиасы для совместимости
        projectName: row.project_name ?? '—',
        statusName: row.status_name ?? '—',
        statusColor: row.status_color,
        responsibleEngineerName: row.engineer_name,
        caseUid: row.case_uid,
        createdByName: row.created_by_name,
      })) || [];
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Оптимизированный хук для статистики пользователей
 * Решает N+1 проблему используя один запрос вместо 6
 */
export function useUserStatsOptimized(
  userId?: string | null,
  period?: [string, string] | null,
) {
  const from = period?.[0] ?? null;
  const to = period?.[1] ?? null;

  return useQuery({
    queryKey: ['user-stats-optimized', userId, from, to],
    enabled: !!userId && !!from && !!to,
    queryFn: async () => {
      // Оптимизированный запрос статистики пользователя
      const { data, error } = await supabase.rpc('get_user_stats_optimized', {
        user_id: userId,
        from_date: from,
        to_date: to,
      });

      if (error) {
        console.error('Error fetching optimized user stats:', error);
        throw error;
      }

      return data?.[0] || {
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
    },
    staleTime: 60_000,
  });
}

/**
 * Оптимизированный хук для получения судебных дел с связанными данными
 */
export function useCourtCasesOptimized() {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();

  return useQuery({
    queryKey: ['court-cases-optimized', projectId, projectIds.join(',')],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_court_cases_with_relations', {
        project_ids: projectIds.length ? projectIds : null,
        only_assigned: onlyAssigned,
      });

      if (error) {
        console.error('Error fetching optimized court cases:', error);
        throw error;
      }

      return data?.map((row: any) => ({
        ...row,
        // Преобразуем даты
        createdAt: row.created_at ? dayjs(row.created_at) : null,
        hearingDate: row.hearing_date ? dayjs(row.hearing_date) : null,
        // Парсим JSON массивы
        unit_ids: row.unit_ids || [],
        claim_ids: row.claim_ids || [],
        party_ids: row.party_ids || [],
      })) || [];
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Оптимизированный хук для получения дефектов с связанными данными
 */
export function useDefectsOptimized() {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();

  return useQuery({
    queryKey: ['defects-optimized', projectId, projectIds.join(',')],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_defects_with_relations', {
        project_ids: projectIds.length ? projectIds : null,
        only_assigned: onlyAssigned,
      });

      if (error) {
        console.error('Error fetching optimized defects:', error);
        throw error;
      }

      return data?.map((row: any) => ({
        ...row,
        // Преобразуем даты
        createdAt: row.created_at ? dayjs(row.created_at) : null,
        fixedAt: row.fixed_at ? dayjs(row.fixed_at) : null,
        receivedAt: row.received_at ? dayjs(row.received_at) : null,
        // Парсим JSON массивы
        attachment_ids: row.attachment_ids || [],
        claim_ids: row.claim_ids || [],
      })) || [];
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Batch loader для получения связей claim-unit
 * Использует покрывающие индексы для оптимизации
 */
export async function batchLoadClaimUnits(claimIds: number[]): Promise<Record<number, number[]>> {
  if (!claimIds.length) return {};

  const { data, error } = await supabase
    .from('claim_units')
    .select('claim_id, unit_id')
    .in('claim_id', claimIds)
    .order('claim_id'); // Используем индекс idx_claim_units_covering

  if (error) {
    console.error('Error batch loading claim units:', error);
    throw error;
  }

  const result: Record<number, number[]> = {};
  data?.forEach((row: any) => {
    if (!result[row.claim_id]) result[row.claim_id] = [];
    result[row.claim_id].push(row.unit_id);
  });

  return result;
}

/**
 * Batch loader для получения связей claim-defect
 * Использует покрывающие индексы для оптимизации
 */
export async function batchLoadClaimDefects(claimIds: number[]): Promise<Record<number, number[]>> {
  if (!claimIds.length) return {};

  const { data, error } = await supabase
    .from('claim_defects')
    .select('claim_id, defect_id')
    .in('claim_id', claimIds)
    .order('claim_id'); // Используем индекс idx_claim_defects_covering

  if (error) {
    console.error('Error batch loading claim defects:', error);
    throw error;
  }

  const result: Record<number, number[]> = {};
  data?.forEach((row: any) => {
    if (!result[row.claim_id]) result[row.claim_id] = [];
    result[row.claim_id].push(row.defect_id);
  });

  return result;
}

/**
 * Оптимизированная загрузка претензий с batch loading
 */
export async function fetchClaimsWithRelations(
  claimIds: number[]
): Promise<any[]> {
  if (!claimIds.length) return [];

  // Параллельно загружаем основные данные и связи
  const [claims, unitsMap, defectsMap] = await Promise.all([
    // Основные данные претензий
    supabase
      .from('claims_summary')
      .select('*')
      .in('id', claimIds)
      .order('id'),
    // Связи с объектами
    batchLoadClaimUnits(claimIds),
    // Связи с дефектами
    batchLoadClaimDefects(claimIds),
  ]);

  if (claims.error) {
    console.error('Error fetching claims:', claims.error);
    throw claims.error;
  }

  // Объединяем данные
  return claims.data?.map((claim: any) => ({
    ...claim,
    unit_ids: unitsMap[claim.id] || [],
    defect_ids: defectsMap[claim.id] || [],
  })) || [];
}