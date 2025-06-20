import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import { filterByProjects } from '@/shared/utils/projectQuery';
import type { Claim } from '@/shared/types/claim';
import { addClaimAttachments } from '@/entities/attachment';

const TABLE = 'claims';

/**
 * Хук получения списка претензий с учётом фильтров проекта.
 */
export function useClaims() {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  return useQuery({
    queryKey: [TABLE, projectId, projectIds.join(',')],
    queryFn: async () => {
      let q = supabase.from(TABLE).select('*');
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      q = q.order('created_at', { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Claim[];
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
      let q = supabase.from(TABLE).select('*').eq('id', claimId);
      q = filterByProjects(q, projectId, projectIds, onlyAssigned);
      q = q.single();
      const { data, error } = await q;
      if (error) throw error;
      return data as Claim;
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
          attachments.map((f: any) => ('file' in f ? { file: f.file, type_id: f.type_id ?? null } : { file: f, type_id: null })),
          created.id,
        );
        ids = uploaded.map((u) => u.id);
        await supabase.from(TABLE).update({ attachment_ids: ids }).eq('id', created.id);
      }
      return { ...created, attachment_ids: ids } as any;
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
