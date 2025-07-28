import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import { filterByProjects } from '@/shared/utils/projectQuery';
import { useNotify } from '@/shared/hooks/useNotify';
import { fetchPaged, fetchByChunks } from '@/shared/api/fetchAll';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import type { Claim } from '@/shared/types/claim';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import type { ClaimDeleteParams } from '@/shared/types/claimDelete';
import type { ClaimDefect } from '@/shared/types/claimDefect';
import type { ClaimSimple } from '@/shared/types/claimSimple';
import type { ClaimIdsMap } from '@/shared/types/claimIdsMap';
import type { ClaimSummary, ClaimSummaryWithDayjs } from '@/shared/types/claimSummary';
import {
  addClaimAttachments,
  getAttachmentsByIds,
  ATTACH_BUCKET,
} from '@/entities/attachment';
import dayjs from 'dayjs';

const TABLE = 'claims';
const SUMMARY_TABLE = 'claims_summary';
const LINK_TABLE = 'claim_links';

/**
 * Преобразует запись из claims_summary в объект претензии с удобными полями.
 */
function mapClaimSummary(r: ClaimSummary): ClaimSummaryWithDayjs {
  const toDayjs = (d: any) => (d ? (dayjs(d).isValid() ? dayjs(d) : null) : null);
  
  return {
    ...r,
    // Преобразуем строковые даты в объекты Dayjs
    claimedOn: toDayjs(r.claimed_on),
    acceptedOn: toDayjs(r.accepted_on),
    registeredOn: toDayjs(r.registered_on),
    resolvedOn: toDayjs(r.resolved_on),
    createdAt: toDayjs(r.created_at),
    
    // Алиасы для совместимости
    projectName: r.project_name ?? '—',
    statusName: r.status_name ?? '—',
    statusColor: r.status_color,
    responsibleEngineerName: r.engineer_name,
    caseUid: r.case_uid,
    createdByName: r.created_by_name,
    
    // Инициализируем пустые массивы (заполняются отдельно при необходимости)
    unit_ids: [],
    defect_ids: [],
    parent_id: r.has_parent ? null : null, // Заполняется из отдельного запроса
    
    // UI поля
    unitNames: '',
    unitNumbers: '',
    buildings: '',
    attachments: [],
    hasCheckingDefect: false,
  } as ClaimSummaryWithDayjs;
}

/**
 * Преобразует запись Supabase в объект претензии с удобными полями.
 * @deprecated Используйте mapClaimSummary для более быстрой работы
 */
function mapClaim(r: any): ClaimWithNames {
  const toDayjs = (d: any) => (d ? (dayjs(d).isValid() ? dayjs(d) : null) : null);
  const attachments = Array.isArray(r.attachments)
    ? r.attachments.map((a: any) => {
        let name = a.original_name;
        if (!name) {
          try {
            name = decodeURIComponent(
              a.storage_path.split('/').pop()?.replace(/^\d+_/, '') ||
                a.storage_path,
            );
          } catch {
            name = a.storage_path;
          }
        }
        return {
          id: a.id,
          path: a.storage_path,
          original_name: a.original_name ?? null,
          name,
          url: a.file_url,
          mime_type: a.mime_type,
          description: a.description ?? null,
        } as import('@/shared/types/claimFile').RemoteClaimFile;
      })
    : [];
  return {
    id: r.id,
    parent_id: r.parent_id ?? null,
    project_id: r.project_id,
    unit_ids: r.unit_ids || [],
    claim_status_id: r.claim_status_id ?? null,
    claim_no: r.claim_no,
    claimed_on: r.claimed_on,
    accepted_on: r.accepted_on,
    registered_on: r.registered_on,
    resolved_on: r.resolved_on,
    engineer_id: r.engineer_id,
    owner: r.owner ?? null,
    case_uid_id: r.case_uid_id ?? null,
    pre_trial_claim: r.pre_trial_claim ?? false,
    defect_ids: r.defect_ids ?? [],
    description: r.description ?? '',
    created_by: r.created_by ?? null,
    createdAt: toDayjs(r.created_at),
    projectName: r.projects?.name ?? '—',
    statusName: r.statuses?.name ?? '—',
    statusColor: r.statuses?.color ?? null,
    responsibleEngineerName: null,
    caseUid: r.court_cases_uids?.uid ?? null,
    unitNames: '',
    // convert strings to dayjs for consumer convenience
    claimedOn: toDayjs(r.claimed_on),
    acceptedOn: toDayjs(r.accepted_on),
    registeredOn: toDayjs(r.registered_on),
    resolvedOn: toDayjs(r.resolved_on),
    attachments,
  } as unknown as ClaimWithNames;
}

/**
 * Проверяет статус претензии и при необходимости переводит связанные
 * дефекты в статус "Закрыто".
 */
async function closeDefectsForClaim(claimId: number, statusId: number | null) {
  if (!statusId) return;
  const { data: claimStatus } = await supabase
    .from('statuses')
    .select('name')
    .eq('id', statusId)
    .maybeSingle();
  if (!claimStatus || !/закры/i.test(claimStatus.name)) return;

  const { data: closedDefStatus } = await supabase
    .from('statuses')
    .select('id')
    .eq('entity', 'defect')
    .ilike('name', '%закры%')
    .maybeSingle();
  if (!closedDefStatus?.id) return;

  const { data: defectRows } = await supabase
    .from('claim_defects')
    .select('defect_id')
    .eq('claim_id', claimId);
  const defectIds = (defectRows ?? []).map((d: any) => d.defect_id);
  if (!defectIds.length) return;

  await supabase.from('defects').update({ status_id: closedDefStatus.id }).in('id', defectIds);
}

/**
 * Помечает все дефекты претензии как относящиеся к досудебной.
 * @param claimId идентификатор претензии
 */
async function markClaimDefectsPreTrial(claimId: number) {
  await supabase
    .from('claim_defects')
    .update({ pre_trial_claim: true })
    .eq('claim_id', claimId)
    .eq('pre_trial_claim', false);
}

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
          .select('*');
        q = filterByProjects(q, projectId, projectIds, onlyAssigned);
        q = q.order('created_at', { ascending: false }).range(from, to);
        return q as unknown as PromiseLike<PostgrestSingleResponse<ClaimSummary[]>>;
      });
      
      const ids = rows.map((r: ClaimSummary) => r.id);
      
      // Получаем связи претензий
      const { data: links } = ids.length
        ? await supabase
            .from(LINK_TABLE)
            .select('parent_id, child_id')
            .in('child_id', ids)
        : { data: [] };
      const linkMap = new Map<number, number>();
      (links ?? []).forEach((l: any) => linkMap.set(l.child_id, l.parent_id));
      
      // Получаем unit_ids для претензий
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
      
      // Получаем defect_ids для претензий
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
      
      return (rows ?? []).map((r: ClaimSummary) => {
        const mapped = mapClaimSummary(r);
        mapped.parent_id = linkMap.get(r.id) ?? null;
        mapped.unit_ids = unitMap[r.id] ?? [];
        mapped.defect_ids = defectMap[r.id] ?? [];
        return mapped;
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
      const { data: links } = ids.length
        ? await supabase
            .from(LINK_TABLE)
            .select('parent_id, child_id')
            .in('child_id', ids)
        : { data: [] };
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
          query = query.eq('responsible_engineer_name', filters.responsible);
        }
        if (filters.units && Array.isArray(filters.units) && filters.units.length > 0) {
          // Фильтрация по объектам через связанную таблицу claim_units
          const { data: unitIds } = await supabase
            .from('units')
            .select('id')
            .in('name', filters.units);
          
          if (unitIds && unitIds.length > 0) {
            const { data: claimIds } = await supabase
              .from('claim_units')
              .select('claim_id')
              .in('unit_id', unitIds.map(u => u.id));
            
            if (claimIds && claimIds.length > 0) {
              query = query.in('id', claimIds.map(c => c.claim_id));
            } else {
              // Если не найдены претензии для выбранных объектов, возвращаем пустой результат
              query = query.in('id', [-1]);
            }
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
      
      const { data: rows, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      const ids = (rows ?? []).map((r: ClaimSummary) => r.id);
      
      // Получаем связи претензий
      const { data: links } = ids.length
        ? await supabase
            .from(LINK_TABLE)
            .select('parent_id, child_id')
            .in('child_id', ids)
        : { data: [] };
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
      const { data: links } = ids.length
        ? await supabase
            .from(LINK_TABLE)
            .select('parent_id, child_id')
            .in('child_id', ids)
        : { data: [] };
      
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
 */
export function useClaimsAllLegacy() {
  return useQuery({
    queryKey: ['claims-all-legacy'],
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
      const { data: links } = ids.length
        ? await supabase
            .from(LINK_TABLE)
            .select('parent_id, child_id')
            .in('child_id', ids)
        : { data: [] };
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
 * Хук создания новой претензии.
 */
export function useCreateClaim() {
  const projectId = useProjectId();
  const userId = useAuthStore((s) => s.profile?.id ?? null);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Omit<Claim, 'id' | 'created_at' | 'created_by' | 'updated_at' | 'updated_by'> & {
        attachments?: Array<File | { file: File; type_id?: number | null }>;
      },
    ) => {
      const { unit_ids = [], defect_ids = [], attachments = [], ...rest } = payload as any;

      if (unit_ids.length) {
        const { data: locked } = await supabase
          .from('units')
          .select('id')
          .in('id', unit_ids)
          .eq('locked', true);
        if (locked && locked.length) {
          throw new Error('Объект заблокирован. Обратитесь в юридический отдел');
        }
      }

      const insertData: any = {
        ...rest,
        project_id: rest.project_id ?? projectId,
        created_by: userId,
      };

      const { data: created, error } = await supabase
        .from(TABLE)
        .insert(insertData)
        .select('id, project_id')
        .single();
      if (error) throw error;

      if (unit_ids.length) {
        const rows = unit_ids.map((uid: number) => ({ claim_id: created.id, unit_id: uid }));
        await supabase.from('claim_units').insert(rows);
      }

      if (defect_ids.length) {
        const rows = defect_ids.map((did: number) => ({
          claim_id: created.id,
          defect_id: did,
          pre_trial_claim: insertData.pre_trial_claim ?? false,
        }));
        await supabase.from('claim_defects').insert(rows);
      }

      if (attachments.length) {
        const uploaded = await addClaimAttachments(
          attachments.map((f: any) =>
            'file' in f
              ? { file: f.file, type_id: f.type_id ?? null, description: f.description }
              : { file: f, type_id: null, description: undefined },
          ),
          created.id,
        );
        const ids = uploaded.map((u: any) => u.id);
        if (ids.length) {
          const rows = ids.map((aid) => ({ claim_id: created.id, attachment_id: aid }));
          await supabase.from('claim_attachments').insert(rows);
        }
      }

      await closeDefectsForClaim(created.id, insertData.claim_status_id ?? null);

      return {
        id: created.id,
        project_id: created.project_id,
      } as Claim;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE + '-all'] });
      qc.invalidateQueries({ queryKey: ['defects'] });
      qc.invalidateQueries({ queryKey: ['claims-simple'] });
      qc.invalidateQueries({ queryKey: ['claims-simple-all'] });
      qc.invalidateQueries({ queryKey: ['claims-all'] });
      qc.invalidateQueries({ queryKey: ['claims-all-legacy'] });
      qc.invalidateQueries({ queryKey: ['claims-optimized'] });
      qc.invalidateQueries({ queryKey: ['claims-stats'] });
      qc.invalidateQueries({ queryKey: ['claims-all-stats'] });
    },
  });
}

/**
 * Хук обновления данных претензии.
 */
export function useUpdateClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Claim>; }) => {
      const { unit_ids, ...rest } = updates as Partial<Claim> & { unit_ids?: number[] };

      const { data, error } = await supabase
        .from(TABLE)
        .update(rest)
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw error;

      if (Array.isArray(unit_ids)) {
        await supabase.from('claim_units').delete().eq('claim_id', id);
        if (unit_ids.length) {
          const rows = unit_ids.map((uid) => ({ claim_id: id, unit_id: uid }));
          await supabase.from('claim_units').insert(rows);
        }
      }

      await closeDefectsForClaim(id, rest.claim_status_id ?? data.claim_status_id ?? null);

      return data as Claim;
    },
    onSuccess: (_, vars) => {
      // Инвалидируем все возможные варианты queryKey для претензий
      qc.invalidateQueries({ queryKey: [TABLE], exact: false });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE], exact: false });
      qc.invalidateQueries({ queryKey: ['claims-simple'], exact: false });
      qc.invalidateQueries({ queryKey: ['claims-simple-all'] });
      qc.invalidateQueries({ queryKey: ['claims-all'], exact: false });
      qc.invalidateQueries({ queryKey: ['claims-all-legacy'] });
      qc.invalidateQueries({ queryKey: ['defects'] });
    },
  });
}

/**
 * Хук удаления претензии.
 */
export function useDeleteClaim() {
  const qc = useQueryClient();
  return useMutation<number, Error, ClaimDeleteParams>({
    /**
   * Удаляет претензию вместе с её файлами, всеми связанными дефектами
   * и записями из таблицы связей претензий. При удалении дефектов
   * учитываются права доступа к проектам.
   * @param payload объект с идентификатором претензии
   */
    mutationFn: async ({ id }) => {
      console.log('[useDeleteClaim] start delete id:', id);
      const { data: attachRows } = await supabase
        .from('claim_attachments')
        .select('attachment_id, attachments(storage_path)')
        .eq('claim_id', id);
      const claimFiles = (attachRows ?? []).map((r: any) => r.attachment_id);
      const paths = (attachRows ?? [])
        .map((r: any) => r.attachments?.storage_path)
        .filter(Boolean);
      console.log('[useDeleteClaim] claim attachments:', paths);


      if (paths.length) {
        await supabase.storage.from(ATTACH_BUCKET).remove(paths);
        await supabase.from('attachments').delete().in('id', claimFiles);
      }
      if (claimFiles.length) {
        await supabase.from('claim_attachments').delete().eq('claim_id', id);
      }

      const { data: defectRows } = await supabase
        .from('claim_defects')
        .select('defect_id')
        .eq('claim_id', id);
      const defectIds = (defectRows ?? []).map((d: any) => d.defect_id);
      console.log('[useDeleteClaim] defects for claim:', defectIds);

      if (defectIds.length) {
        const { data: defAttachRows } = await supabase
          .from('defect_attachments')
          .select('attachment_id, attachments(storage_path)')
          .in('defect_id', defectIds);
        const defFiles = (defAttachRows ?? []).map((r: any) => r.attachment_id);
        const defPaths = (defAttachRows ?? [])
          .map((r: any) => r.attachments?.storage_path)
          .filter(Boolean);
        if (defPaths.length) {
          console.log('[useDeleteClaim] defect attachments:', defPaths);
          await supabase.storage.from(ATTACH_BUCKET).remove(defPaths);
          await supabase.from('attachments').delete().in('id', defFiles);
        }
        if (defFiles.length) {
          await supabase
            .from('defect_attachments')
            .delete()
            .in('attachment_id', defFiles);
        }
        const dq = await supabase.from('defects').delete().in('id', defectIds);
        console.log('[useDeleteClaim] delete defects result:', dq.error || 'ok');
        if (dq.error) throw dq.error;
        await supabase.from('claim_defects').delete().eq('claim_id', id);
      }

      await supabase.from('claim_units').delete().eq('claim_id', id);

      await supabase
        .from(LINK_TABLE)
        .delete()
        .or(`child_id.eq.${id},parent_id.eq.${id}`);

      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      console.log('[useDeleteClaim] delete claim result:', error || 'ok');
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE + '-all'] });
      qc.invalidateQueries({ queryKey: ['defects'] });
      qc.invalidateQueries({ queryKey: ['claims-simple'] });
      qc.invalidateQueries({ queryKey: ['claims-simple-all'] });
      qc.invalidateQueries({ queryKey: ['claims-all'] });
      qc.invalidateQueries({ queryKey: ['claims-all-legacy'] });
      qc.invalidateQueries({ queryKey: ['claims-optimized'] });
      qc.invalidateQueries({ queryKey: ['claims-stats'] });
      qc.invalidateQueries({ queryKey: ['claims-all-stats'] });
    },
  });
}

/** Получить вложения претензии по её идентификатору */
export function useClaimAttachments(id?: number) {
  return useQuery({
    queryKey: ['claim-attachments', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from('claim_attachments')
        .select('attachments(id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by)')
        .eq('claim_id', id as number);
      return (data ?? []).map((r: any) => r.attachments);
    },
    staleTime: 5 * 60_000,
  });
}

/** Удалить одно вложение претензии */
export function useRemoveClaimAttachment() {
  const qc = useQueryClient();
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  return useMutation<void, Error, { claimId: number; attachmentId: number }>({
    mutationFn: async ({ claimId, attachmentId }) => {
      const { data: att } = await supabase
        .from('attachments')
        .select('storage_path')
        .eq('id', attachmentId)
        .single();
      if (att?.storage_path) {
        await supabase.storage.from(ATTACH_BUCKET).remove([att.storage_path]);
      }
      await supabase.from('attachments').delete().eq('id', attachmentId);
      await supabase
        .from('claim_attachments')
        .delete()
        .eq('claim_id', claimId)
        .eq('attachment_id', attachmentId);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [TABLE, vars.claimId] });
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
    },
  });
}

/**
 * Удаляет несколько вложений претензии за один запрос.
 */
export async function removeClaimAttachmentsBulk(
  claimId: number,
  attachmentIds: number[],
): Promise<void> {
  if (attachmentIds.length === 0) return;
  const { data: atts } = await supabase
    .from('attachments')
    .select('storage_path')
    .in('id', attachmentIds);
  const paths = (atts ?? [])
    .map((a: any) => a.storage_path)
    .filter(Boolean);
  if (paths.length) {
    await supabase.storage.from(ATTACH_BUCKET).remove(paths);
  }
  await supabase.from('attachments').delete().in('id', attachmentIds);
  await supabase
    .from('claim_attachments')
    .delete()
    .eq('claim_id', claimId)
    .in('attachment_id', attachmentIds);
}

/** Добавить вложения к существующей претензии */
export function useAddClaimAttachments() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: async ({ claimId, files }: { claimId: number; files: File[] }) => {
      const uploaded = await addClaimAttachments(
        files.map((f) => ({ file: f, type_id: null, description: undefined })),
        claimId,
      );
      if (uploaded.length) {
        const rows = uploaded.map((u) => ({ claim_id: claimId, attachment_id: u.id }));
        await supabase.from('claim_attachments').insert(rows);
      }
      return uploaded;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [TABLE, vars.claimId] });
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      notify.success('Файлы загружены');
    },
    onError: (e) => notify.error(`Ошибка загрузки файлов: ${e.message}`),
  });
}

export async function signedUrl(path: string, filename = ''): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60, { download: filename || undefined });
  if (error) throw error;
  return data.signedUrl;
}

export async function signedUrlForPreview(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}

export function useClaimLinks() {
  return useQuery({
    queryKey: [LINK_TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(LINK_TABLE)
        .select('id, parent_id, child_id');
      if (error) throw error;
      return (data ?? []) as import('@/shared/types/claimLink').ClaimLink[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useLinkClaims() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, childIds }: { parentId: string; childIds: string[] }) => {
      const ids = childIds.map((c) => Number(c));
      if (ids.length === 0) return;
      await supabase.from(LINK_TABLE).delete().in('child_id', ids);
      const rows = ids.map((child_id) => ({ parent_id: Number(parentId), child_id }));
      await supabase.from(LINK_TABLE).insert(rows);
      qc.invalidateQueries({ queryKey: [LINK_TABLE] });
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
    },
  });
}

export function useUnlinkClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      const childId = Number(id);
      await supabase.from(LINK_TABLE).delete().eq('child_id', childId);
      qc.invalidateQueries({ queryKey: [LINK_TABLE] });
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
    },
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

/**
 * Получить статистику по всем претензиям (общее количество, закрытые, открытые).
 */
export function useClaimsAllStats() {
  return useQuery({
    queryKey: ['claims-all-stats'],
    queryFn: async () => {
      // Получаем общее количество претензий
      const { count: totalCount } = await supabase
        .from(TABLE)
        .select('*', { count: 'exact', head: true });

      // Получаем ID статуса "Закрыто"
      const { data: closedStatus } = await supabase
        .from('statuses')
        .select('id')
        .eq('entity', 'claim')
        .ilike('name', '%закры%')
        .maybeSingle();

      let closedCount = 0;
      if (closedStatus?.id) {
        // Получаем количество закрытых претензий
        const { count } = await supabase
          .from(TABLE)
          .select('*', { count: 'exact', head: true })
          .eq('claim_status_id', closedStatus.id);
        closedCount = count || 0;
      }

      return {
        total: totalCount || 0,
        closed: closedCount,
        open: (totalCount || 0) - closedCount,
      };
    },
    staleTime: 30_000, // Кешировать на 30 секунд
  });
}

/**
 * Получить статистику по претензиям проекта (общее количество, закрытые, открытые).
 */
export function useClaimsStats() {
  const { projectId, projectIds, onlyAssigned, enabled } = useProjectFilter();
  
  return useQuery({
    queryKey: ['claims-stats', projectId, projectIds.join(',')],
    enabled,
    queryFn: async () => {
      // Строим базовый запрос
      let baseQuery: any = supabase.from(TABLE).select('*', { count: 'exact', head: true });
      baseQuery = filterByProjects(baseQuery, projectId, projectIds, onlyAssigned);
      
      // Получаем общее количество претензий
      const { count: totalCount } = await baseQuery;

      // Получаем ID статуса "Закрыто"
      const { data: closedStatus } = await supabase
        .from('statuses')
        .select('id')
        .eq('entity', 'claim')
        .ilike('name', '%закры%')
        .maybeSingle();

      let closedCount = 0;
      if (closedStatus?.id) {
        // Получаем количество закрытых претензий
        let closedQuery: any = supabase
          .from(TABLE)
          .select('*', { count: 'exact', head: true })
          .eq('claim_status_id', closedStatus.id);
        closedQuery = filterByProjects(closedQuery, projectId, projectIds, onlyAssigned);
        
        const { count } = await closedQuery;
        closedCount = count || 0;
      }

      return {
        total: totalCount || 0,
        closed: closedCount,
        open: (totalCount || 0) - closedCount,
      };
    },
    staleTime: 30_000, // Кешировать на 30 секунд
  });
}

export { closeDefectsForClaim, markClaimDefectsPreTrial };

