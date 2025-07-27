import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { useAuthStore } from '@/shared/store/authStore';
import type { CourtCase, Defect } from '@/shared/types/courtCase';
import type { NewCaseFile } from '@/shared/types/caseFile';
import type { CourtCaseSummary, CourtCaseSummaryWithDayjs } from '@/shared/types/courtCaseSummary';
import { addCaseAttachments, getAttachmentsByIds, ATTACH_BUCKET } from '@/entities/attachment';
import { fetchPaged, fetchByChunks } from '@/shared/api/fetchAll';
import dayjs from 'dayjs';

const CASES_TABLE = 'court_cases';
const CASES_SUMMARY_TABLE = 'court_cases_summary';
const DEFECTS_TABLE = 'defects';
const CASE_DEFECTS_TABLE = 'court_case_defects';
const CASE_LINKS_TABLE = 'court_case_links';
/** Связующая таблица "дело - объект" */
const CASE_UNITS_TABLE = 'court_case_units';
/** Связующая таблица "дело - вложение" */
const CASE_ATTACH_TABLE = 'court_case_attachments';

/**
 * Преобразует запись из court_cases_summary в объект судебного дела с удобными полями.
 */
function mapCourtCaseSummary(r: CourtCaseSummary): CourtCaseSummaryWithDayjs {
  const toDayjs = (d: any) => (d ? (dayjs(d).isValid() ? dayjs(d) : null) : null);
  
  return {
    ...r,
    // Преобразуем строковые даты в объекты Dayjs
    fixStartDate: toDayjs(r.fix_start_date),
    fixEndDate: toDayjs(r.fix_end_date),
    createdAt: toDayjs(r.created_at),
    updatedAt: toDayjs(r.updated_at),
    caseDate: toDayjs(r.date),
    
    // Алиасы для совместимости
    projectName: r.project_name ?? '—',
    statusName: r.status_name ?? '—',
    statusColor: r.status_color,
    responsibleLawyerName: r.lawyer_name,
    caseUid: r.case_uid,
    
    // Инициализируем пустые массивы (заполняются отдельно при необходимости)
    unit_ids: [],
    defect_ids: [],
    party_ids: [],
    claim_ids: [],
    
    // UI поля
    unitNames: '',
    unitNumbers: '',
    buildings: '',
    attachments: [],
  } as CourtCaseSummaryWithDayjs;
}

/**
 * Хук получения списка судебных дел с использованием представления court_cases_summary (оптимизированный).
 */
export function useCourtCasesSummary() {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  return useQuery({
    queryKey: [CASES_SUMMARY_TABLE, projectId, projectIds.join(',')],
    queryFn: async () => {
      const rows = await fetchPaged<CourtCaseSummary>((from, to) => {
        let q: any = supabase
          .from(CASES_SUMMARY_TABLE)
          .select('*');
        if (onlyAssigned) {
          q = q.in('project_id', projectIds.length ? projectIds : [-1]);
        }
        q = q.order('id', { ascending: false }).range(from, to);
        return q;
      });
      
      const ids = rows.map((r: CourtCaseSummary) => r.id);
      
      // Получаем unit_ids для дел
      const unitRows = ids.length
        ? await fetchByChunks(ids, (chunk) =>
            supabase.from(CASE_UNITS_TABLE).select('court_case_id, unit_id').in('court_case_id', chunk),
          )
        : [];
      const unitMap: Record<number, number[]> = {};
      (unitRows ?? []).forEach((u: any) => {
        if (!unitMap[u.court_case_id]) unitMap[u.court_case_id] = [];
        unitMap[u.court_case_id].push(u.unit_id);
      });
      
      // Получаем связи дел
      const { data: links } = await supabase
        .from(CASE_LINKS_TABLE)
        .select('parent_id, child_id');
      const linkMap = new Map<number, number>();
      (links ?? []).forEach((l: any) => linkMap.set(l.child_id, l.parent_id));
      
      return (rows ?? []).map((r: CourtCaseSummary) => {
        const mapped = mapCourtCaseSummary(r);
        mapped.unit_ids = unitMap[r.id] ?? [];
        // Добавляем parent_id для совместимости с существующим типом CourtCase
        (mapped as any).parent_id = linkMap.get(r.id) ?? null;
        return mapped;
      });
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * @deprecated Используйте useCourtCasesSummary для более быстрой работы
 */
export function useCourtCases() {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  return useQuery({
    queryKey: [CASES_TABLE, projectId, projectIds.join(',')],
    queryFn: async () => {
      let query = supabase
        .from(CASES_TABLE)
        .select('*, court_cases_uids(id, uid)');
      if (onlyAssigned) {
        query = query.in('project_id', projectIds.length ? projectIds : [-1]);
      }
      // Sort cases by ID in descending order for consistent latest-first view
      query = query.order('id', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;

      const ids = (data ?? []).map((r: any) => r.id);
      const { data: unitRows } = ids.length
        ? await supabase
            .from(CASE_UNITS_TABLE)
            .select('court_case_id, unit_id')
            .in('court_case_id', ids)
        : { data: [] };
      const unitMap = new Map<number, number[]>();
      (unitRows ?? []).forEach((r: any) => {
        const arr = unitMap.get(r.court_case_id) || [];
        arr.push(r.unit_id);
        unitMap.set(r.court_case_id, arr);
      });


      const { data: links, error: linkErr } = await supabase
        .from(CASE_LINKS_TABLE)
        .select('parent_id, child_id');
      if (linkErr) throw linkErr;
      const linkMap = new Map<number, number>();
      (links ?? []).forEach((l) => linkMap.set(l.child_id, l.parent_id));

      const { data: claimRows } = ids.length
        ? await supabase
            .from('court_case_claims')
            .select('case_id, claimed_amount')
            .in('case_id', ids)
        : { data: [] };
      const claimMap = new Map<number, number>();
      (claimRows ?? []).forEach((r: any) => {
        const sum = claimMap.get(r.case_id) || 0;
        claimMap.set(r.case_id, sum + Number(r.claimed_amount) || 0);
      });

      return (data ?? []).map((row: any) => ({
        ...row,
        unit_ids: unitMap.get(row.id) || [],
        parent_id: linkMap.get(row.id) ?? null,
        total_claim_amount:
          row.total_claim_amount != null && Number(row.total_claim_amount) > 0
            ? Number(row.total_claim_amount)
            : claimMap.get(row.id) ?? null,
        caseUid: row.court_cases_uids?.uid ?? null,
      })) as CourtCase[];
    },
    staleTime: 5 * 60_000,
  });
}


export function useAddCourtCase() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.profile?.id ?? null);
  return useMutation({
    /**
     * Создать новое судебное дело и привязать его к выбранным объектам.
     */
    mutationFn: async (
      payload: Omit<CourtCase, 'id' | 'created_at' | 'updated_at'>,
    ) => {
      const {
        unit_ids = [],
        attachment_ids = [],
        ...rest
      } = payload as unknown as {
        unit_ids?: number[] | string[];
        attachment_ids?: number[] | string[];
        [k: string]: any;
      };

      const { data: inserted, error } = await supabase
        .from(CASES_TABLE)
        .insert({ ...rest, created_by: userId })
        .select('*')
        .single();
      if (error) throw error;

      const caseId = inserted.id as number;
      if (unit_ids.length) {
        const rows = unit_ids.map((uid) => ({
          court_case_id: caseId,
          unit_id: uid,
        }));
        const { error: unitsErr } = await supabase
          .from(CASE_UNITS_TABLE)
          .insert(rows);
        if (unitsErr) throw unitsErr;
      }

      if (attachment_ids.length) {
        const rows = attachment_ids.map((aid) => ({
          court_case_id: caseId,
          attachment_id: aid,
        }));
        const { error: attErr } = await supabase
          .from(CASE_ATTACH_TABLE)
          .insert(rows);
        if (attErr) throw attErr;
      }

      return { ...inserted, unit_ids, attachment_ids } as CourtCase;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_SUMMARY_TABLE] });
    },
  });
}

export function useUpdateCourtCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<CourtCase> }) => {
      const {
        unit_ids,
        attachment_ids,
        ...rest
      } = updates as unknown as {
        unit_ids?: number[];
        attachment_ids?: number[];
        [k: string]: any;
      };

      if (Object.keys(rest).length) {
        const { error } = await supabase
          .from(CASES_TABLE)
          .update(rest)
          .eq('id', id);
        if (error) throw error;
      }

      if (Array.isArray(unit_ids)) {
        await supabase.from(CASE_UNITS_TABLE).delete().eq('court_case_id', id);
        if (unit_ids.length) {
          const rows = unit_ids.map((uid) => ({ court_case_id: id, unit_id: uid }));
          const { error: unitsErr } = await supabase
            .from(CASE_UNITS_TABLE)
            .insert(rows);
          if (unitsErr) throw unitsErr;
        }
      }

      if (Array.isArray(attachment_ids)) {
        await supabase.from(CASE_ATTACH_TABLE).delete().eq('court_case_id', id);
        if (attachment_ids.length) {
          const rows = attachment_ids.map((aid) => ({
            court_case_id: id,
            attachment_id: aid,
          }));
          const { error: attErr } = await supabase
            .from(CASE_ATTACH_TABLE)
            .insert(rows);
          if (attErr) throw attErr;
        }
      }


      const { data } = await supabase
        .from(CASES_TABLE)
        .select('*')
        .eq('id', id)
        .single();
      return data as CourtCase;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_SUMMARY_TABLE] });
    },
  });
}

export function useDeleteCourtCase() {
  const { projectId } = useProjectFilter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, project_id }: { id: number; project_id?: number }) => {
      const { data: courtCase } = await supabase
        .from(CASES_TABLE)
        .select('project_id')
        .eq('id', id)
        .single();

      const { data: attachRows } = await supabase
        .from(CASE_ATTACH_TABLE)
        .select('attachment_id, attachments(storage_path)')
        .eq('court_case_id', id);
      const ids = (attachRows ?? []).map((r: any) => r.attachment_id);

      if (ids.length) {
        const paths = (attachRows ?? [])
          .map((r: any) => r.attachments?.storage_path)
          .filter(Boolean);
        if (paths.length) {
          await supabase.storage.from(ATTACH_BUCKET).remove(paths);
        }
        await supabase.from('attachments').delete().in('id', ids);
        await supabase.from(CASE_ATTACH_TABLE).delete().eq('court_case_id', id);
      }

      const projectIdToMatch = project_id ?? projectId ?? courtCase.project_id;
      const { error } = await supabase
        .from(CASES_TABLE)
        .delete()
        .eq('id', id)
        .eq('project_id', projectIdToMatch);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_SUMMARY_TABLE] });
    },
  });
}


export function useCaseDefects(caseId: number) {
  return useQuery({
    queryKey: [CASE_DEFECTS_TABLE, caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(CASE_DEFECTS_TABLE)
        .select(
          'defect_id, defects(id, description, type_id, status_id, received_at, fixed_at)'
        )
        .eq('case_id', caseId);
      if (error) throw error;
      const rows = data ?? [];
      return rows.map((r: any) => ({
        id: r.defects.id,
        description: r.defects.description,
        type_id: r.defects.type_id,
        status_id: r.defects.status_id,
        received_at: r.defects.received_at,
        fixed_at: r.defects.fixed_at,
        case_id: caseId,
      })) as Defect[];
    },
    enabled: !!caseId,
    staleTime: 5 * 60_000,
  });
}

export function useAddDefect() {
  const qc = useQueryClient();
  return useMutation({
    /**
     * Creates a defect record and links it to a court case.
     * `project_id` is required by DB constraints, so it must be provided.
     */
    mutationFn: async (
      payload: { case_id: number; project_id: number } & Omit<Defect, 'id' | 'case_id'>,
    ) => {
      const { data, error } = await supabase
        .from(DEFECTS_TABLE)
        .insert({
          project_id: payload.project_id,
          description: payload.description,
          type_id: payload.type_id,
          status_id: payload.status_id,
          received_at: payload.received_at,
          fixed_at: payload.fixed_at,
        })
        .select('id')
        .single();
      if (error) throw error;
      const defId = data.id;
      const { error: linkErr } = await supabase
        .from(CASE_DEFECTS_TABLE)
        .insert({ case_id: payload.case_id, defect_id: defId });
      if (linkErr) throw linkErr;
      qc.invalidateQueries({ queryKey: [CASE_DEFECTS_TABLE, payload.case_id] });
      return {
        id: defId,
        description: payload.description,
        type_id: payload.type_id,
        status_id: payload.status_id,
        received_at: payload.received_at,
        fixed_at: payload.fixed_at,
      } as Defect;
    },
  });
}

export function useDeleteDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, case_id }: { id: number; case_id: number }) => {
      const { error } = await supabase
        .from(CASE_DEFECTS_TABLE)
        .delete()
        .eq('case_id', case_id)
        .eq('defect_id', id);
      if (error) throw error;
      return { id, case_id };
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [CASE_DEFECTS_TABLE, vars.case_id] });
    },
  });
}

export function useUpdateDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      case_id,
      updates,
    }: {
      id: number;
      case_id: number;
      updates: Pick<
        Defect,
        'description' | 'type_id' | 'status_id' | 'received_at' | 'fixed_at'
      >;
    }) => {
      const { error } = await supabase
        .from(DEFECTS_TABLE)
        .update({
          description: updates.description,
          type_id: updates.type_id,
          status_id: updates.status_id,
          received_at: updates.received_at,
          fixed_at: updates.fixed_at,
        })
        .eq('id', id);
      if (error) throw error;
      return { id, case_id, ...updates };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [CASE_DEFECTS_TABLE, vars.case_id] });
    },
  });
}

export function useCaseLinks() {
  return useQuery({
    queryKey: [CASE_LINKS_TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(CASE_LINKS_TABLE)
        .select('id, parent_id, child_id');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useLinkCases() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, childIds }: { parentId: string; childIds: string[] }) => {
      const ids = childIds.map((c) => Number(c));
      if (ids.length === 0) return;
      await supabase.from(CASE_LINKS_TABLE).delete().in('child_id', ids);
      const rows = ids.map((child_id) => ({ parent_id: Number(parentId), child_id }));
      await supabase.from(CASE_LINKS_TABLE).insert(rows);
      qc.invalidateQueries({ queryKey: [CASE_LINKS_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_SUMMARY_TABLE] });
    },
  });
}

export function useUnlinkCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const childId = Number(id);
      await supabase.from(CASE_LINKS_TABLE).delete().eq('child_id', childId);
      qc.invalidateQueries({ queryKey: [CASE_LINKS_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_SUMMARY_TABLE] });
    },
  });
}

export function useCourtCase(caseId: number | string | undefined) {
  const id = Number(caseId);
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['court_case', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(CASES_TABLE)
        .select('*, court_cases_uids(id, uid)')
        .eq('id', id)
        .single();
      if (error) throw error;

      const { data: unitRows } = await supabase
        .from(CASE_UNITS_TABLE)
        .select('unit_id')
        .eq('court_case_id', id);
      const unitIds = (unitRows ?? []).map((r: any) => r.unit_id);


      const { data: attachRows } = await supabase
        .from(CASE_ATTACH_TABLE)
        .select('attachment_id')
        .eq('court_case_id', id);
      const attIds = (attachRows ?? []).map((r: any) => r.attachment_id);
      let attachments: any[] = [];
      if (attIds.length) {
        const files = await getAttachmentsByIds(attIds);
        attachments = files;
      }
      const result = {
        ...(data as any),
        unit_ids: unitIds,
        attachment_ids: attIds,
        attachments,
        caseUid: (data as any).court_cases_uids?.uid ?? null,
      } as CourtCase & { attachments: any[] };
      return result;
    },
    staleTime: 5 * 60_000,
  });
}

export function useUpdateCourtCaseFull() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      newAttachments = [],
      removedAttachmentIds = [],
      updatedAttachments = [],
      updates = {},
    }: {
      id: number;
      newAttachments?: NewCaseFile[];
      removedAttachmentIds?: number[];
      updatedAttachments?: { id: number; type_id: number | null }[];
      updates?: Partial<CourtCase>;
    }) => {
      const { data: current } = await supabase
        .from(CASE_ATTACH_TABLE)
        .select('attachment_id, attachments(storage_path)')
        .eq('court_case_id', id);
      let ids: number[] = (current ?? []).map((r: any) => r.attachment_id);

      if (removedAttachmentIds.length) {
        const { data: atts } = await supabase
          .from('attachments')
          .select('storage_path')
          .in('id', removedAttachmentIds);
        if (atts?.length)
          await supabase.storage
            .from(ATTACH_BUCKET)
            .remove(atts.map((a) => a.storage_path));
        await supabase.from('attachments').delete().in('id', removedAttachmentIds);
        await supabase
          .from(CASE_ATTACH_TABLE)
          .delete()
          .eq('court_case_id', id)
          .in('attachment_id', removedAttachmentIds);
        ids = ids.filter((i) => !removedAttachmentIds.includes(Number(i)));
      }

      if (Object.keys(updates).length) {
        const upd: any = { ...updates };
        if (Object.prototype.hasOwnProperty.call(updates, 'unit_ids')) {
          await supabase
            .from(CASE_UNITS_TABLE)
            .delete()
            .eq('court_case_id', id);
          const uids = updates.unit_ids as number[] | undefined;
          if (uids?.length) {
            const rows = uids.map((uid) => ({ court_case_id: id, unit_id: uid }));
            await supabase.from(CASE_UNITS_TABLE).insert(rows);
          }
          delete upd.unit_ids;
        }
        const { error } = await supabase
          .from(CASES_TABLE)
          .update(upd)
          .eq('id', id);
        if (error) throw error;
      }

      if (updatedAttachments.length) {
        // attachment type updates removed
      }

      let uploaded: any[] = [];
      if (newAttachments.length) {
        uploaded = await addCaseAttachments(
          newAttachments.map((f) => ({
            file: f.file,
            type_id: null,
            description: (f as any).description,
          })),
          id,
        );
        ids = ids.concat(uploaded.map((u) => u.id));
        if (uploaded.length) {
          const rows = uploaded.map((u: any) => ({
            court_case_id: id,
            attachment_id: u.id,
          }));
          await supabase.from(CASE_ATTACH_TABLE).insert(rows);
        }
      }

      return uploaded;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_SUMMARY_TABLE] });
      qc.invalidateQueries({ queryKey: ['court_case', vars.id] });
    },
  });
}

export async function signedUrl(path: string, filename = ''): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60, { download: filename || undefined });
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Проверяет уникальность номера судебного дела.
 * @param number Номер для проверки
 * @returns `true`, если номер свободен
 */
export async function isCaseNumberUnique(number: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(CASES_TABLE)
    .select('id')
    .eq('number', number)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return !data?.id;
}
