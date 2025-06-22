import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import { filterByProjects } from '@/shared/utils/projectQuery';
import { useNotify } from '@/shared/hooks/useNotify';
import type { Claim } from '@/shared/types/claim';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import type { ClaimDeleteParams } from '@/shared/types/claimDelete';
import {
  addClaimAttachments,
  getAttachmentsByIds,
  ATTACH_BUCKET,
} from '@/entities/attachment';
import dayjs from 'dayjs';

const TABLE = 'claims';

/**
 * Преобразует запись Supabase в объект претензии с удобными полями.
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
          type: a.file_type,
        } as import('@/shared/types/claimFile').RemoteClaimFile;
      })
    : [];
  return {
    id: r.id,
    project_id: r.project_id,
    unit_ids: r.unit_ids || [],
    claim_status_id: r.claim_status_id ?? null,
    claim_no: r.claim_no,
    claimed_on: r.claimed_on,
    accepted_on: r.accepted_on,
    registered_on: r.registered_on,
    resolved_on: r.resolved_on,
    engineer_id: r.engineer_id,
    is_official: r.is_official ?? false,
    defect_ids: r.defect_ids ?? [],
    description: r.description ?? '',
    projectName: r.projects?.name ?? '—',
    statusName: r.statuses?.name ?? '—',
    statusColor: r.statuses?.color ?? null,
    responsibleEngineerName: null,
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
 * Хук получения списка претензий с учётом фильтров проекта.
 */
export function useClaims() {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  return useQuery({
    queryKey: [TABLE, projectId, projectIds.join(',')],
    queryFn: async () => {
      let q = supabase
        .from(TABLE)
        .select(
          `id, project_id, claim_status_id, claim_no, claimed_on,
          accepted_on, registered_on, resolved_on,
          engineer_id, description, is_official, created_at,
          projects (id, name),
          statuses (id, name, color)`,
        );
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      q = q.order('created_at', { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      const ids = (data ?? []).map((r: any) => r.id) as number[];

      const { data: unitRows, error: unitErr } = ids.length
        ? await supabase
            .from('claim_units')
            .select('claim_id, unit_id')
            .in('claim_id', ids)
        : { data: [], error: null };
      if (unitErr) throw unitErr;
      const unitMap: Record<number, number[]> = {};
      (unitRows ?? []).forEach((u: any) => {
        if (!unitMap[u.claim_id]) unitMap[u.claim_id] = [];
        unitMap[u.claim_id].push(u.unit_id);
      });


      const { data: defectRows, error: defectErr } = ids.length
        ? await supabase
            .from('claim_defects')
            .select('claim_id, defect_id, is_official')
            .in('claim_id', ids)
        : { data: [], error: null };
      if (defectErr) throw defectErr;
      const defectMap: Record<number, number[]> = {};
      (defectRows ?? []).forEach((d: any) => {
        if (!defectMap[d.claim_id]) defectMap[d.claim_id] = [];
        defectMap[d.claim_id].push(d.defect_id);
      });

      const { data: attachRows, error: attErr } = ids.length
        ? await supabase
            .from('claim_attachments')
            .select(
              'claim_id, attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)',
            )
            .in('claim_id', ids)
        : { data: [], error: null };
      if (attErr) throw attErr;
      const attachMap: Record<number, any[]> = {};
      (attachRows ?? []).forEach((row: any) => {
        const file = row.attachments;
        if (!file) return;
        const arr = attachMap[row.claim_id] ?? [];
        arr.push(file);
        attachMap[row.claim_id] = arr;
      });

      return (data ?? []).map((r: any) =>
        mapClaim({
          ...r,
          unit_ids: unitMap[r.id] ?? [],
          defect_ids: defectMap[r.id] ?? [],
          attachments: attachMap[r.id] ?? [],
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
      let q = supabase
        .from(TABLE)
        .select(
          `id, project_id, claim_status_id, claim_no, claimed_on,
          accepted_on, registered_on, resolved_on,
          engineer_id, description, is_official, created_at,
          projects (id, name),
          statuses (id, name, color)`,
        )
        .eq('id', claimId);
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      q = q.single();
      const { data, error } = await q;
      if (error) throw error;
      const { data: units } = await supabase
        .from('claim_units')
        .select('unit_id')
        .eq('claim_id', claimId);
      const unitIds = (units ?? []).map((u: any) => u.unit_id);

      const { data: defects } = await supabase
        .from('claim_defects')
        .select('defect_id')
        .eq('claim_id', claimId);
      const defectIds = (defects ?? []).map((d: any) => d.defect_id);

      const { data: attachRows } = await supabase
        .from('claim_attachments')
        .select(
          'attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)'
        )
        .eq('claim_id', claimId);
      const attachments = (attachRows ?? []).map((row: any) => row.attachments);

      return mapClaim({
        ...data,
        unit_ids: unitIds,
        defect_ids: defectIds,
        attachments,
      });
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить список претензий по всем проектам (минимальный набор полей).
 */
export function useClaimsSimpleAll() {
  return useQuery({
    queryKey: ['claims-simple-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, project_id, is_official');
      if (error) throw error;
      const ids = (data ?? []).map((r: any) => r.id) as number[];

      const { data: unitRows } = ids.length
        ? await supabase.from('claim_units').select('claim_id, unit_id').in('claim_id', ids)
        : { data: [] };
      const unitMap: Record<number, number[]> = {};
      (unitRows ?? []).forEach((u: any) => {
        if (!unitMap[u.claim_id]) unitMap[u.claim_id] = [];
        unitMap[u.claim_id].push(u.unit_id);
      });

      const { data: ticketRows } = ids.length
        ? await supabase.from('claim_tickets').select('claim_id, ticket_id').in('claim_id', ids)
        : { data: [] };
      const ticketMap: Record<number, number[]> = {};
      (ticketRows ?? []).forEach((t: any) => {
        if (!ticketMap[t.claim_id]) ticketMap[t.claim_id] = [];
        ticketMap[t.claim_id].push(t.ticket_id);
      });

      const { data: defectRows } = ids.length
        ? await supabase
            .from('claim_defects')
            .select('claim_id, defect_id, is_official')
            .in('claim_id', ids)
        : { data: [] };
      const defectMap: Record<number, number[]> = {};
      (defectRows ?? []).forEach((d: any) => {
        if (!defectMap[d.claim_id]) defectMap[d.claim_id] = [];
        defectMap[d.claim_id].push(d.defect_id);
      });


      return (data ?? []).map((r: any) => ({
        id: r.id,
        project_id: r.project_id,
        is_official: r.is_official ?? false,
        unit_ids: unitMap[r.id] ?? [],
        defect_ids: defectMap[r.id] ?? [],
      }));
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить список претензий текущего проекта (минимальный набор полей).
 */
export function useClaimsSimple() {
  const { projectId, projectIds, onlyAssigned, enabled } = useProjectFilter();
  return useQuery({
    queryKey: ['claims-simple', projectId, projectIds.join(',')],
    enabled,
    queryFn: async () => {
      let q = supabase
        .from(TABLE)
        .select('id, project_id, is_official');
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      const { data, error } = await q;
      if (error) throw error;
      const ids = (data ?? []).map((r: any) => r.id) as number[];

      const { data: unitRows } = ids.length
        ? await supabase.from('claim_units').select('claim_id, unit_id').in('claim_id', ids)
        : { data: [] };
      const unitMap: Record<number, number[]> = {};
      (unitRows ?? []).forEach((u: any) => {
        if (!unitMap[u.claim_id]) unitMap[u.claim_id] = [];
        unitMap[u.claim_id].push(u.unit_id);
      });

      const { data: ticketRows } = ids.length
        ? await supabase.from('claim_tickets').select('claim_id, ticket_id').in('claim_id', ids)
        : { data: [] };
      const ticketMap: Record<number, number[]> = {};
      (ticketRows ?? []).forEach((t: any) => {
        if (!ticketMap[t.claim_id]) ticketMap[t.claim_id] = [];
        ticketMap[t.claim_id].push(t.ticket_id);
      });

      const { data: defectRows } = ids.length
        ? await supabase
            .from('claim_defects')
            .select('claim_id, defect_id, is_official')
            .in('claim_id', ids)
        : { data: [] };
      const defectMap: Record<number, number[]> = {};
      (defectRows ?? []).forEach((d: any) => {
        if (!defectMap[d.claim_id]) defectMap[d.claim_id] = [];
        defectMap[d.claim_id].push(d.defect_id);
      });
      return (data ?? []).map((r: any) => ({
        id: r.id,
        project_id: r.project_id,
        is_official: r.is_official ?? false,
        unit_ids: unitMap[r.id] ?? [],
        defect_ids: defectMap[r.id] ?? [],
      }));
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

      const insertData: any = {
        ...rest,
        is_official: rest.is_official ?? false,
        project_id: rest.project_id ?? projectId,
        created_by: userId,
      };

      const { data: created, error } = await supabase
        .from(TABLE)
        .insert(insertData)
        .select('id, project_id, is_official')
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
          is_official: insertData.is_official ?? false,
        }));
        await supabase.from('claim_defects').insert(rows);
      }

      if (attachments.length) {
        const uploaded = await addClaimAttachments(
          attachments.map((f: any) =>
            'file' in f ? { file: f.file, type_id: f.type_id ?? null } : { file: f, type_id: null },
          ),
          created.id,
        );
        const ids = uploaded.map((u: any) => u.id);
        if (ids.length) {
          const rows = ids.map((aid) => ({ claim_id: created.id, attachment_id: aid }));
          await supabase.from('claim_attachments').insert(rows);
        }
      }

      return {
        id: created.id,
        project_id: created.project_id,
        is_official: created.is_official,
      } as Claim;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
}

/**
 * Хук обновления данных претензии.
 */
export function useUpdateClaim() {
  const qc = useQueryClient();
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Claim>; }) => {
      const { unit_ids, ...rest } = updates as Partial<Claim> & { unit_ids?: number[] };

      let q = supabase.from(TABLE).update(rest).eq('id', id);
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      const { data, error } = await q.select('*').single();
      if (error) throw error;

      if (Array.isArray(unit_ids)) {
        await supabase.from('claim_units').delete().eq('claim_id', id);
        if (unit_ids.length) {
          const rows = unit_ids.map((uid) => ({ claim_id: id, unit_id: uid }));
          await supabase.from('claim_units').insert(rows);
        }
      }

      return data as Claim;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [TABLE, id] });
    },
  });
}

/**
 * Хук удаления претензии.
 */
export function useDeleteClaim() {
  const qc = useQueryClient();
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  return useMutation<number, Error, ClaimDeleteParams>({
    /**
     * Удаляет претензию вместе с загруженными файлами и связанными дефектами.
     * @param payload объект с идентификатором претензии и массивом дефектов
     */
    mutationFn: async ({ id, ticketIds = [] }) => {
      const { data: attachRows } = await supabase
        .from('claim_attachments')
        .select('attachment_id, attachments(storage_path)')
        .eq('claim_id', id);
      const claimFiles = (attachRows ?? []).map((r: any) => r.attachment_id);
      const paths = (attachRows ?? [])
        .map((r: any) => r.attachments?.storage_path)
        .filter(Boolean);

      const { data: ticketRows } = await supabase
        .from('claim_tickets')
        .select('ticket_id')
        .eq('claim_id', id);
      const claimTickets = ticketIds.length
        ? ticketIds
        : (ticketRows ?? []).map((t: any) => t.ticket_id);

      if (paths.length) {
        await supabase.storage.from(ATTACH_BUCKET).remove(paths);
        await supabase.from('attachments').delete().in('id', claimFiles);
      }
      if (claimFiles.length) {
        await supabase.from('claim_attachments').delete().eq('claim_id', id);
      }

      if (claimTickets.length) {
        await supabase.from('tickets').delete().in('id', claimTickets);
        await supabase.from('claim_tickets').delete().eq('claim_id', id);
      }

      await supabase.from('claim_units').delete().eq('claim_id', id);

      let q = supabase.from(TABLE).delete().eq('id', id);
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      const { error } = await q;
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
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
        .select('attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)')
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
    },
  });
}

/** Добавить вложения к существующей претензии */
export function useAddClaimAttachments() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: async ({ claimId, files }: { claimId: number; files: File[] }) => {
      const uploaded = await addClaimAttachments(
        files.map((f) => ({ file: f, type_id: null })),
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

