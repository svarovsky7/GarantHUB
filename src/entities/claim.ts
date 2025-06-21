import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import { filterByProjects } from '@/shared/utils/projectQuery';
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
          path: a.path,
          mime_type: a.mime_type,
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
    ticket_ids: r.ticket_ids ?? [],
    description: r.description ?? '',
    projectName: r.projects?.name ?? '—',
    statusName: r.claim_statuses?.name ?? '—',
    statusColor: r.claim_statuses?.color ?? null,
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
          `id, project_id, unit_ids, claim_status_id, claim_no, claimed_on,
          accepted_on, registered_on, resolved_on,
          engineer_id, ticket_ids, description, created_at, attachment_ids,
          projects (id, name),
          claim_statuses (id, name, color)`,
        );
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      q = q.order('created_at', { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      const allIds = Array.from(
        new Set((data ?? []).flatMap((c) => c.attachment_ids || [])),
      );
      let filesMap: Record<number, any> = {};
      if (allIds.length) {
        const files = await getAttachmentsByIds(allIds);
        files.forEach((f) => {
          filesMap[f.id] = {
            id: f.id,
            storage_path: f.storage_path,
            original_name: f.original_name,
            path: f.path,
            mime_type: f.mime_type,
          };
        });
      }
      const result: ClaimWithNames[] = [];
      for (const r of data ?? []) {
        const atts = (r.attachment_ids || [])
          .map((i: number) => filesMap[i])
          .filter(Boolean);
        if (atts.length !== (r.attachment_ids || []).length) {
          const existIds = atts.map((a: any) => a.id);
          let upq = supabase
            .from(TABLE)
            .update({ attachment_ids: existIds })
            .eq('id', r.id);
          upq = filterByProjects(upq, projectId, projectIds, onlyAssigned);
          await upq;
          r.attachment_ids = existIds;
        }
        result.push(mapClaim({ ...r, attachments: atts }));
      }
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
      let q = supabase
        .from(TABLE)
        .select(
          `id, project_id, unit_ids, claim_status_id, claim_no, claimed_on,
          accepted_on, registered_on, resolved_on,
          engineer_id, ticket_ids, description, created_at, attachment_ids,
          projects (id, name),
          claim_statuses (id, name, color)`,
        )
        .eq('id', claimId);
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      q = q.single();
      const { data, error } = await q;
      if (error) throw error;
      let attachments: any[] = [];
      if (data?.attachment_ids?.length) {
        const files = await getAttachmentsByIds(data.attachment_ids);
        attachments = files.map((f) => ({
          id: f.id,
          storage_path: f.storage_path,
          original_name: f.original_name,
          path: f.path,
          mime_type: f.mime_type,
        }));
        const existIds = files.map((f) => f.id);
        if (existIds.length !== data.attachment_ids.length) {
          let uq = supabase
            .from(TABLE)
            .update({ attachment_ids: existIds })
            .eq('id', claimId);
          uq = filterByProjects(uq, projectId, projectIds, onlyAssigned);
          await uq;
          data.attachment_ids = existIds;
        }
      }
      return mapClaim({ ...data, attachments });
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить список претензий по всем проектам (минимальный набор полей).
 */
export function useClaimsSimpleAll() {
  return useQuery<Array<{ id: number; project_id: number; unit_ids: number[]; ticket_ids: number[] }>>({
    queryKey: ['claims-simple-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, project_id, unit_ids, ticket_ids');
      if (error) throw error;
      return (data ?? []) as Array<{ id: number; project_id: number; unit_ids: number[]; ticket_ids: number[] }>;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить список претензий текущего проекта (минимальный набор полей).
 */
export function useClaimsSimple() {
  const { projectId, projectIds, onlyAssigned, enabled } = useProjectFilter();
  return useQuery<Array<{ id: number; project_id: number; unit_ids: number[]; ticket_ids: number[] }>>({
    queryKey: ['claims-simple', projectId, projectIds.join(',')],
    enabled,
    queryFn: async () => {
      let q = supabase
        .from(TABLE)
        .select('id, project_id, unit_ids, ticket_ids');
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Array<{ id: number; project_id: number; unit_ids: number[]; ticket_ids: number[] }>;
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
    mutationFn: async ({ attachments = [], ...payload }: Omit<Claim, 'id'> & { attachments?: any[] }) => {
      const { data: created, error } = await supabase
        .from(TABLE)
        .insert({ ...payload, project_id: payload.project_id ?? projectId, created_by: userId })
        .select('id, project_id')
        .single();
      if (error) throw error;
      let ids: number[] = [];
      if (attachments.length) {
        const uploaded = await addClaimAttachments(
          attachments.map((f: any) =>
            'file' in f ? { file: f.file, type_id: f.type_id ?? null } : { file: f, type_id: null },
          ),
          created.id,
        );
        ids = uploaded.map((u: any) => u.id);
        await supabase.from(TABLE).update({ attachment_ids: ids }).eq('id', created.id);
      }
      return { ...created, attachment_ids: ids } as Claim;
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
      let q = supabase.from(TABLE).update(updates).eq('id', id);
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      const { data, error } = await q.select('*').single();
      if (error) throw error;
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
      const { data: claim } = await supabase
        .from(TABLE)
        .select('attachment_ids, ticket_ids')
        .eq('id', id)
        .single();

      const claimFiles = (claim?.attachment_ids ?? []) as number[];
      const claimTickets = ticketIds.length
        ? ticketIds
        : ((claim?.ticket_ids ?? []) as number[]);

      if (claimFiles.length) {
        const files = await getAttachmentsByIds(claimFiles);
        if (files?.length) {
          await supabase.storage
            .from(ATTACH_BUCKET)
            .remove(files.map((f) => f.storage_path));
        }
        await supabase.from('attachments').delete().in('id', claimFiles);
      }

      if (claimTickets.length) {
        await supabase.from('tickets').delete().in('id', claimTickets);
      }

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
        .from(TABLE)
        .select('attachment_ids')
        .eq('id', id as number)
        .single();
      const ids: number[] = data?.attachment_ids ?? [];
      if (!ids.length) return [];
      return getAttachmentsByIds(ids);
    },
    staleTime: 5 * 60_000,
  });
}

export async function signedUrl(path: string, filename = ''): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60, { download: filename || undefined });
  if (error) throw error;
  return data.signedUrl;
}
