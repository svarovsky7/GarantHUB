import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import { filterByProjects } from '@/shared/utils/projectQuery';
import type { Claim } from '@/shared/types/claim';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import { addClaimAttachments, ATTACH_BUCKET } from '@/entities/attachment';
import dayjs from 'dayjs';

const TABLE = 'claims';

/**
 * Преобразует запись Supabase в объект претензии с удобными полями.
 */
function mapClaim(r: any): ClaimWithNames {
  const toDayjs = (d: any) => (d ? (dayjs(d).isValid() ? dayjs(d) : null) : null);
  return {
    id: r.id,
    project_id: r.project_id,
    unit_ids: r.unit_ids || [],
    status_id: r.status_id ?? null,
    number: r.number,
    claim_date: r.claim_date,
    received_by_developer_at: r.received_by_developer_at,
    registered_at: r.registered_at,
    fixed_at: r.fixed_at,
    responsible_engineer_id: r.responsible_engineer_id,
    defect_ids: r.defect_ids ?? [],
    projectName: r.projects?.name ?? '—',
    statusName: r.claim_statuses?.name ?? '—',
    statusColor: r.claim_statuses?.color ?? null,
    responsibleEngineerName: null,
    unitNames: '',
    // convert strings to dayjs for consumer convenience
    claimDate: toDayjs(r.claim_date),
    receivedByDeveloperAt: toDayjs(r.received_by_developer_at),
    registeredAt: toDayjs(r.registered_at),
    fixedAt: toDayjs(r.fixed_at),
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
          `id, project_id, unit_ids, status_id, number, claim_date,
          received_by_developer_at, registered_at, fixed_at,
          responsible_engineer_id, defect_ids, created_at,
          projects (id, name),
          claim_statuses (id, name, color)`,
        );
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      q = q.order('created_at', { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapClaim);
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
          `id, project_id, unit_ids, status_id, number, claim_date,
          received_by_developer_at, registered_at, fixed_at,
          responsible_engineer_id, defect_ids, created_at,
          projects (id, name),
          claim_statuses (id, name, color)`,
        )
        .eq('id', claimId);
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      q = q.single();
      const { data, error } = await q;
      if (error) throw error;
      return mapClaim(data);
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить список претензий по всем проектам (минимальный набор полей).
 */
export function useClaimsSimpleAll() {
  return useQuery<Array<{ id: number; project_id: number; unit_ids: number[]; defect_ids: number[] }>>({
    queryKey: ['claims-simple-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, project_id, unit_ids, defect_ids');
      if (error) throw error;
      return (data ?? []) as Array<{ id: number; project_id: number; unit_ids: number[]; defect_ids: number[] }>;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить список претензий текущего проекта (минимальный набор полей).
 */
export function useClaimsSimple() {
  const { projectId, projectIds, onlyAssigned, enabled } = useProjectFilter();
  return useQuery<Array<{ id: number; project_id: number; unit_ids: number[]; defect_ids: number[] }>>({
    queryKey: ['claims-simple', projectId, projectIds.join(',')],
    enabled,
    queryFn: async () => {
      let q = supabase
        .from(TABLE)
        .select('id, project_id, unit_ids, defect_ids');
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Array<{ id: number; project_id: number; unit_ids: number[]; defect_ids: number[] }>;
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
      if (attachments.length) {
        await addClaimAttachments(
          attachments.map((f: any) =>
            'file' in f ? { file: f.file, type_id: f.type_id ?? null } : { file: f, type_id: null },
          ),
          created.id,
        );
      }
      return created as Claim;
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
  return useMutation({
    mutationFn: async (id: number) => {
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
      const { data, error } = await supabase
        .from('attachments')
        .select(
          'id, storage_path, file_url, file_type, attachment_type_id, original_name',
        )
        .ilike('storage_path', `claims/${id}/%`);
      if (error) throw error;
      return data ?? [];
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
