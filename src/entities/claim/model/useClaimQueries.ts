import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { filterByProjects } from '@/shared/utils/projectQuery';
import { fetchPaged, fetchByChunks } from '@/shared/api/fetchAll';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import type { ClaimSimple } from '@/shared/types/claimSimple';
import type { ClaimDefect } from '@/shared/types/claimDefect';
import type { ClaimIdsMap } from '@/shared/types/claimIdsMap';
import type { ClaimSummary } from '@/shared/types/claimSummary';
import { mapClaimSummary, mapClaim, TABLE, SUMMARY_TABLE, LINK_TABLE } from './mappers';

/**
 * Хук получения списка претензий с использованием представления claims_summary (оптимизированный).
 */
export function useClaimsSummary() {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  return useQuery({
    queryKey: [SUMMARY_TABLE, projectId, projectIds.join(',')],
    queryFn: async () => {
      const rows = await fetchPaged<ClaimSummary>((from, to) => {
        let q: any = supabase
          .from(SUMMARY_TABLE)
          .select('*'); // VIEW содержит ВСЕ данные: unit_ids, defect_ids, unit_names, building_names, parent_id!
        q = filterByProjects(q, projectId, projectIds, onlyAssigned);
        q = q.order('created_at', { ascending: false}).range(from, to);
        return q as unknown as PromiseLike<PostgrestSingleResponse<ClaimSummary[]>>;
      });

      // ✅ МАКСИМАЛЬНАЯ ОПТИМИЗАЦИЯ: ВСЕ данные уже в VIEW!
      // - unit_ids ✅ в VIEW
      // - defect_ids ✅ в VIEW
      // - parent_id ✅ в VIEW (после миграции)
      //
      // Устранено:
      // - 4 chunked запроса к claim_units/claim_defects
      // - 6 chunked запросов к claim_links
      // = 10 запросов меньше!

      return (rows ?? []).map((r: ClaimSummary) => {
        // ✅ mapClaimSummary уже извлекает ВСЕ данные из VIEW
        // Включая parent_id, unit_ids, defect_ids!
        return mapClaimSummary(r);
      });
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Хук получения списка претензий с учётом фильтров проекта.
 * @deprecated Используйте useClaimsSummary для более быстрой работы
 */
export function useClaims() {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();

  return useQuery({
    queryKey: [TABLE, projectId, projectIds.join(',')],
    queryFn: async () => {
      const rows = await fetchPaged<any>((from, to) => {
        let q: any = supabase
          .from(TABLE)
          .select(
            `id, project_id, claim_status_id, claim_no, claimed_on,
          accepted_on, registered_on, resolved_on,
          engineer_id, owner, case_uid_id, pre_trial_claim, description, created_at, created_by,
          projects (id, name),
          court_cases_uids(id, uid),
          statuses (id, name, color),
          claim_units(unit_id),
          claim_defects(defect_id),
          claim_attachments(attachments(id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by))`,
          );
        q = filterByProjects(q, projectId, projectIds, onlyAssigned);
        q = q.order('created_at', { ascending: false }).range(from, to);
        return q as unknown as PromiseLike<PostgrestSingleResponse<any[]>>;
      });
      const ids = rows.map((r: any) => r.id);

      // Chunk IDs to avoid URL length limit (max 100 IDs per request)
      const chunkSize = 100;
      let allLinks: any[] = [];

      if (ids.length > 0) {
        for (let i = 0; i < ids.length; i += chunkSize) {
          const chunk = ids.slice(i, i + chunkSize);
          const { data: chunkLinks } = await supabase
            .from(LINK_TABLE)
            .select('parent_id, child_id')
            .in('child_id', chunk);
          if (chunkLinks) {
            allLinks = allLinks.concat(chunkLinks);
          }
        }
      }

      const links = allLinks;
      const linkMap = new Map<number, number>();
      (links ?? []).forEach((l: any) => linkMap.set(l.child_id, l.parent_id));

      const result = (rows ?? []).map((r: any) =>
        mapClaim({
          ...r,
          parent_id: linkMap.get(r.id) ?? null,
          unit_ids: (r.claim_units ?? []).map((u: any) => u.unit_id),
          defect_ids: (r.claim_defects ?? []).map((d: any) => d.defect_id),
          attachments: (r.claim_attachments ?? []).map((a: any) => a.attachments),
        }),
      );

      return result;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Хук получения одной претензии по идентификатору.
 */
export function useClaim(id?: number | string) {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  const claimId = Number(id);
  return useQuery({
    queryKey: [TABLE, claimId],
    enabled: !!claimId,
    queryFn: async () => {
      let q: any = supabase
        .from(TABLE)
        .select(
          `id, project_id, claim_status_id, claim_no, claimed_on,
          accepted_on, registered_on, resolved_on,
          engineer_id, owner, case_uid_id, pre_trial_claim, description, created_at, created_by,
          projects (id, name),
          court_cases_uids(id, uid),
          statuses (id, name, color),
          claim_units(unit_id),
          claim_defects(defect_id),
          claim_attachments(attachments(id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by))`,
        )
        .eq('id', claimId);
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      q = q.maybeSingle();
      const { data, error } = await q;
      if (error) throw error;
      if (!data) return null;
      const { data: link } = await supabase
        .from(LINK_TABLE)
        .select('parent_id')
        .eq('child_id', claimId)
        .maybeSingle();
      return mapClaim({
        ...data,
        parent_id: link?.parent_id ?? null,
        unit_ids: (data.claim_units ?? []).map((u: any) => u.unit_id),
        defect_ids: (data.claim_defects ?? []).map((d: any) => d.defect_id),
        attachments: (data.claim_attachments ?? []).map((a: any) => a.attachments),
      });
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить претензию без фильтрации по проекту.
 */
export function useClaimAll(id?: number | string) {
  const claimId = Number(id);
  return useQuery({
    queryKey: ['claim-all', claimId],
    enabled: !!claimId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          `id, project_id, claim_status_id, claim_no, claimed_on,
          accepted_on, registered_on, resolved_on,
          engineer_id, owner, case_uid_id, pre_trial_claim, description, created_at, created_by,
          projects (id, name),
          court_cases_uids(id, uid),
          statuses (id, name, color),
          claim_units(unit_id),
          claim_defects(defect_id),
          claim_attachments(attachments(id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by))`,
        )
        .eq('id', claimId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: link } = await supabase
        .from(LINK_TABLE)
        .select('parent_id')
        .eq('child_id', claimId)
        .maybeSingle();
      return mapClaim({
        ...data,
        parent_id: link?.parent_id ?? null,
        unit_ids: (data.claim_units ?? []).map((u: any) => u.unit_id),
        defect_ids: (data.claim_defects ?? []).map((d: any) => d.defect_id),
        attachments: (data.claim_attachments ?? []).map((a: any) => a.attachments),
      });
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить список претензий по всем проектам с пагинацией (оптимизированный).
 */
export function useClaimsAllSummary(page = 0, pageSize = 50, filters?: any) {

  return useQuery({
    queryKey: [SUMMARY_TABLE + '-all', page, pageSize, filters],
    queryFn: async () => {
      console.log(`[useClaimsAllSummary] Called with page=${page}, pageSize=${pageSize}`);
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from(SUMMARY_TABLE)
        .select('*', { count: 'exact' });

      // Применяем фильтры на сервере
      if (filters) {
        if (filters.project && Array.isArray(filters.project) && filters.project.length > 0) {
          query = query.in('project_name', filters.project);
        }
        if (filters.status) {
          query = query.eq('status_name', filters.status);
        }
        if (filters.responsible) {
          query = query.eq('engineer_name', filters.responsible);
        }
        if (filters.units && Array.isArray(filters.units) && filters.units.length > 0) {
          // Создаем запрос для поиска объектов
          let unitsQuery = supabase
            .from('units')
            .select('id')
            .in('name', filters.units);

          // Если есть фильтр по проектам, ограничиваем поиск объектов только этими проектами
          if (filters.project && Array.isArray(filters.project) && filters.project.length > 0) {
            // Сначала получаем ID проектов по их названиям
            const { data: projectIds } = await supabase
              .from('projects')
              .select('id')
              .in('name', filters.project);

            if (projectIds && projectIds.length > 0) {
              unitsQuery = unitsQuery.in('project_id', projectIds.map(p => p.id));
            } else {
              // Если не найдены проекты, то и объектов не будет - возвращаем пустой результат
              query = query.in('id', [-1]); // Фильтр, который не найдет ни одной записи
              return { data: [], count: 0, hasMore: false };
            }
          }

          const { data: unitIds } = await unitsQuery;

          if (unitIds && unitIds.length > 0) {
            const { data: claimIds } = await supabase
              .from('claim_units')
              .select('claim_id')
              .in('unit_id', unitIds.map(u => u.id));

            if (claimIds && claimIds.length > 0) {
              const claimIdsList = claimIds.map(c => c.claim_id);
              query = query.in('id', claimIdsList);
            } else {
              // Если не найдены претензии для выбранных объектов, возвращаем пустой результат
              query = query.in('id', [-1]);
            }
          } else {
            // Если не найдены объекты, возвращаем пустой результат
            query = query.in('id', [-1]);
          }
        }
        if (filters.building && Array.isArray(filters.building) && filters.building.length > 0) {
          // Фильтрация по корпусам через связанную таблицу
          const { data: unitIds } = await supabase
            .from('units')
            .select('id')
            .in('building', filters.building);

          if (unitIds && unitIds.length > 0) {
            const { data: claimIds } = await supabase
              .from('claim_units')
              .select('claim_id')
              .in('unit_id', unitIds.map(u => u.id));

            if (claimIds && claimIds.length > 0) {
              query = query.in('id', claimIds.map(c => c.claim_id));
            } else {
              query = query.in('id', [-1]);
            }
          }
        }
        if (filters.hideClosed) {
          query = query.not('status_name', 'ilike', '%закры%')
                       .not('status_name', 'ilike', '%не%гаран%');
        }
      }

      // For large page sizes (client-side filtering), fetch all records using pagination
      let rows: ClaimSummary[] = [];
      let count = 0;
      let error = null;

      if (pageSize >= 10000) {
        // Fetch all records in chunks to bypass Supabase's 1000 row limit
        console.log('[useClaimsAllSummary] Fetching all records in chunks...');
        const allRows: ClaimSummary[] = [];
        const chunkSize = 1000;
        let currentFrom = 0;

        // First get the total count (reuse existing query)
        const { count: totalCount, error: countError } = await query;
        if (countError) {
          error = countError;
        } else {
          count = totalCount || 0;
          console.log(`[useClaimsAllSummary] Total records to fetch: ${count}`);

          // Fetch all records in chunks
          while (currentFrom < count) {
            const currentTo = currentFrom + chunkSize - 1;
            console.log(`[useClaimsAllSummary] Fetching chunk: ${currentFrom}-${currentTo}`);

            // Create a fresh query for each chunk to avoid state issues
            let chunkQuery = supabase
              .from(SUMMARY_TABLE)
              .select('*');

            // Re-apply the same filters
            if (filters) {
              if (filters.project && Array.isArray(filters.project) && filters.project.length > 0) {
                chunkQuery = chunkQuery.in('project_name', filters.project);
              }
              if (filters.status) {
                chunkQuery = chunkQuery.eq('status_name', filters.status);
              }
              if (filters.responsible) {
                chunkQuery = chunkQuery.eq('engineer_name', filters.responsible);
              }
              if (filters.hideClosed) {
                chunkQuery = chunkQuery.not('status_name', 'ilike', '%закры%')
                                       .not('status_name', 'ilike', '%не%гаран%');
              }
            }

            const { data: chunk, error: chunkError } = await chunkQuery
              .order('created_at', { ascending: false })
              .range(currentFrom, currentTo);

            if (chunkError) {
              error = chunkError;
              break;
            }

            if (chunk) {
              allRows.push(...chunk);
            }

            if (!chunk || chunk.length < chunkSize) {
              break; // No more records
            }

            currentFrom += chunkSize;
          }
          rows = allRows;
          console.log(`[useClaimsAllSummary] Fetched ${rows.length} total records`);
        }
      } else {
        // Normal pagination
        const result = await query.order('created_at', { ascending: false }).range(from, to);
        rows = result.data || [];
        count = result.count || 0;
        error = result.error;
      }

      if (error) throw error;

      const ids = (rows ?? []).map((r: ClaimSummary) => r.id);

      // Получаем связи претензий (с чанкингом для избежания лимита URL)
      console.log(`[useClaimsAllSummary] Fetching links for ${ids.length} claims`);
      const links = ids.length
        ? await fetchByChunks(ids, (chunk) => {
            console.log(`[useClaimsAllSummary] Fetching links chunk of ${chunk.length} IDs`);
            return supabase
              .from(LINK_TABLE)
              .select('parent_id, child_id')
              .in('child_id', chunk);
          })
        : [];
      const linkMap = new Map<number, number>();
      (links ?? []).forEach((l: any) => linkMap.set(l.child_id, l.parent_id));

      // Получаем unit_ids
      const unitRows = ids.length
        ? await fetchByChunks(ids, (chunk) =>
            supabase.from('claim_units').select('claim_id, unit_id').in('claim_id', chunk),
          )
        : [];
      const unitMap: Record<number, number[]> = {};
      (unitRows ?? []).forEach((u: any) => {
        if (!unitMap[u.claim_id]) unitMap[u.claim_id] = [];
        unitMap[u.claim_id].push(u.unit_id);
      });

      // Получаем defect_ids
      const defectRows = ids.length
        ? await fetchByChunks(ids, (chunk) =>
            supabase.from('claim_defects').select('claim_id, defect_id').in('claim_id', chunk),
          )
        : [];
      const defectMap: Record<number, number[]> = {};
      (defectRows ?? []).forEach((d: any) => {
        if (!defectMap[d.claim_id]) defectMap[d.claim_id] = [];
        defectMap[d.claim_id].push(d.defect_id);
      });

      return {
        data: (rows ?? []).map((r: ClaimSummary) => {
          const mapped = mapClaimSummary(r);
          mapped.parent_id = linkMap.get(r.id) ?? null;
          mapped.unit_ids = unitMap[r.id] ?? [];
          mapped.defect_ids = defectMap[r.id] ?? [];
          return mapped;
        }),
        count: count ?? 0,
        hasMore: (count ?? 0) > to + 1,
      };
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить список претензий по всем проектам с пагинацией.
 * @deprecated Используйте useClaimsAllSummary для более быстрой работы
 */
export function useClaimsAll(page = 0, pageSize = 50) {
  return useQuery({
    queryKey: ['claims-all', page, pageSize],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: rows, error, count } = await supabase
        .from(TABLE)
        .select(
          `id, project_id, claim_status_id, claim_no, claimed_on,
          accepted_on, registered_on, resolved_on,
          engineer_id, owner, case_uid_id, pre_trial_claim, description, created_at, created_by,
          projects (id, name),
          statuses (id, name, color),
          claim_units(unit_id),
          claim_defects(defect_id)`,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const ids = (rows ?? []).map((r: any) => r.id);
      console.log(`[useClaimsAll] Fetching links for ${ids.length} claims`);
      const links = ids.length
        ? await fetchByChunks(ids, (chunk) => {
            console.log(`[useClaimsAll] Fetching links chunk of ${chunk.length} IDs`);
            return supabase
              .from(LINK_TABLE)
              .select('parent_id, child_id')
              .in('child_id', chunk);
          })
        : [];

      const linkMap = new Map<number, number>();
      (links ?? []).forEach((l: any) => linkMap.set(l.child_id, l.parent_id));

      return {
        data: (rows ?? []).map((r: any) =>
          mapClaim({
            ...r,
            parent_id: linkMap.get(r.id) ?? null,
            unit_ids: (r.claim_units ?? []).map((u: any) => u.unit_id),
            defect_ids: (r.claim_defects ?? []).map((d: any) => d.defect_id),
            attachments: [], // Загружаем вложения отдельно по требованию
          }),
        ),
        count: count ?? 0,
        hasMore: (count ?? 0) > to + 1,
      };
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить все претензии без пагинации (для обратной совместимости).
 * @param enabled - Включить/выключить запрос (по умолчанию false для оптимизации)
 */
export function useClaimsAllLegacy(enabled = false) {
  return useQuery({
    queryKey: ['claims-all-legacy'],
    enabled,  // ✅ Не делаем запрос по умолчанию!
    queryFn: async () => {
      const rows = await fetchPaged<any>((from, to) =>
        supabase
          .from(TABLE)
          .select(
            `id, project_id, claim_status_id, claim_no, claimed_on,
          accepted_on, registered_on, resolved_on,
          engineer_id, owner, case_uid_id, pre_trial_claim, description, created_at, created_by,
          projects (id, name),
          statuses (id, name, color),
          claim_units(unit_id),
          claim_defects(defect_id),
          claim_attachments(attachments(id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by))`,
          )
          .order('created_at', { ascending: false })
          .range(from, to) as unknown as PromiseLike<PostgrestSingleResponse<any[]>>,
      );
      const ids = rows.map((r: any) => r.id);
      console.log(`[useClaimsLegacy] Fetching links for ${ids.length} claims`);
      const links = ids.length
        ? await fetchByChunks(ids, (chunk) => {
            console.log(`[useClaimsLegacy] Fetching links chunk of ${chunk.length} IDs`);
            return supabase
              .from(LINK_TABLE)
              .select('parent_id, child_id')
              .in('child_id', chunk);
          })
        : [];
      const linkMap = new Map<number, number>();
      (links ?? []).forEach((l: any) => linkMap.set(l.child_id, l.parent_id));
      return (rows ?? []).map((r: any) =>
        mapClaim({
          ...r,
          parent_id: linkMap.get(r.id) ?? null,
          unit_ids: (r.claim_units ?? []).map((u: any) => u.unit_id),
          defect_ids: (r.claim_defects ?? []).map((d: any) => d.defect_id),
          attachments: (r.claim_attachments ?? []).map((a: any) => a.attachments),
        }),
      );
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить список претензий по всем проектам (минимальный набор полей).
 */
export function useClaimsSimpleAll() {
  return useQuery<ClaimSimple[]>({
    queryKey: ['claims-simple-all'],
    queryFn: async () => {
      const data = await fetchPaged<{ id: number; project_id: number }>((from, to) =>
        supabase.from(TABLE).select('id, project_id').range(from, to),
      );
      const ids = data.map((r) => r.id);

      const unitRows = ids.length
        ? await fetchByChunks(ids, (chunk) =>
            supabase.from('claim_units').select('claim_id, unit_id').in('claim_id', chunk),
          )
        : [];
      const unitMap: Record<number, number[]> = {};
      (unitRows ?? []).forEach((u: any) => {
        if (!unitMap[u.claim_id]) unitMap[u.claim_id] = [];
        unitMap[u.claim_id].push(u.unit_id);
      });

      const defectRows = ids.length
        ? await fetchByChunks(ids, (chunk) =>
            supabase
              .from('claim_defects')
              .select('claim_id, defect_id, pre_trial_claim')
              .in('claim_id', chunk),
          )
        : [];
      const defectMap: Record<number, number[]> = {};
      const claimDefectMap: Record<number, ClaimDefect[]> = {};
      (defectRows ?? []).forEach((d: any) => {
        if (!defectMap[d.claim_id]) defectMap[d.claim_id] = [];
        defectMap[d.claim_id].push(d.defect_id);
        if (!claimDefectMap[d.claim_id]) claimDefectMap[d.claim_id] = [];
        claimDefectMap[d.claim_id].push({
          claim_id: d.claim_id,
          defect_id: d.defect_id,
          pre_trial_claim: d.pre_trial_claim ?? false,
        });
      });


      return data.map((r: any) => ({
        id: r.id,
        project_id: r.project_id,
        unit_ids: unitMap[r.id] ?? [],
        defect_ids: defectMap[r.id] ?? [],
        claim_defects: claimDefectMap[r.id] ?? [],
      })) as ClaimSimple[];
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить список претензий текущего проекта (минимальный набор полей).
 */
export function useClaimsSimple() {
  const { projectId, projectIds, onlyAssigned, enabled } = useProjectFilter();
  return useQuery<ClaimSimple[]>({
    queryKey: ['claims-simple', projectId, projectIds.join(',')],
    enabled,
    queryFn: async () => {
      const rows = await fetchPaged<{ id: number; project_id: number }>((from, to) => {
        let qb: any = supabase.from(TABLE).select('id, project_id');
        qb = filterByProjects(qb, projectId, projectIds, onlyAssigned);
        return qb.range(from, to);
      });
      const ids = rows.map((r) => r.id);

      const unitRows = ids.length
        ? await fetchByChunks(ids, (chunk) =>
            supabase.from('claim_units').select('claim_id, unit_id').in('claim_id', chunk),
          )
        : [];
      const unitMap: Record<number, number[]> = {};
      (unitRows ?? []).forEach((u: any) => {
        if (!unitMap[u.claim_id]) unitMap[u.claim_id] = [];
        unitMap[u.claim_id].push(u.unit_id);
      });

      const defectRows = ids.length
        ? await fetchByChunks(ids, (chunk) =>
            supabase
              .from('claim_defects')
              .select('claim_id, defect_id, pre_trial_claim')
              .in('claim_id', chunk),
          )
        : [];
      const defectMap: Record<number, number[]> = {};
      const claimDefectMap: Record<number, ClaimDefect[]> = {};
      (defectRows ?? []).forEach((d: any) => {
        if (!defectMap[d.claim_id]) defectMap[d.claim_id] = [];
        defectMap[d.claim_id].push(d.defect_id);
        if (!claimDefectMap[d.claim_id]) claimDefectMap[d.claim_id] = [];
        claimDefectMap[d.claim_id].push({
          claim_id: d.claim_id,
          defect_id: d.defect_id,
          pre_trial_claim: d.pre_trial_claim ?? false,
        });
      });
      return rows.map((r: any) => ({
        id: r.id,
        project_id: r.project_id,
        unit_ids: unitMap[r.id] ?? [],
        defect_ids: defectMap[r.id] ?? [],
        claim_defects: claimDefectMap[r.id] ?? [],
      })) as ClaimSimple[];
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить связанные с дефектами идентификаторы претензий.
 * @param defectIds массив идентификаторов дефектов
 */
export function useClaimIdsByDefectIds(defectIds?: number[]) {
  return useQuery<ClaimIdsMap>({
    queryKey: ['claim-ids-by-defect', (defectIds ?? []).join(',')],
    enabled: Array.isArray(defectIds) && defectIds.length > 0,
    queryFn: async () => {
      const rows = await fetchByChunks(defectIds as number[], (chunk) =>
        supabase
          .from('claim_defects')
          .select('claim_id, defect_id')
          .in('defect_id', chunk),
      );
      const map: ClaimIdsMap = {};
      rows.forEach((row: any) => {
        const dId = Number(row.defect_id);
        const cId = Number(row.claim_id);
        if (!map[dId]) map[dId] = [];
        map[dId].push(cId);
      });
      return map;
    },
    staleTime: 5 * 60_000,
  });
}
