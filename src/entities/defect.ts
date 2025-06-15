import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useNotify } from '@/shared/hooks/useNotify';
import { addDefectAttachments, getAttachmentsByIds, ATTACH_BUCKET } from '@/entities/attachment';
import { useAuthStore } from '@/shared/store/authStore';
import type { DefectRecord } from '@/shared/types/defect';
import type { DefectWithNames } from '@/shared/types/defectWithNames';

export interface NewDefect {
  description: string;
  defect_type_id: number | null;
  defect_status_id: number | null;
  brigade_id: number | null;
  contractor_id: number | null;
  received_at: string | null;
  fixed_at: string | null;
  fixed_by: string | null;
}

const TABLE = 'defects';

/** Получить все дефекты проекта */
export function useDefects() {
  return useQuery<DefectRecord[]>({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          'id, description, defect_type_id, defect_status_id, brigade_id, contractor_id, received_at, fixed_at, fixed_by, attachment_ids, created_at,' +
          ' defect_type:defect_types(id,name), defect_status:defect_statuses(id,name,color), fixed_by_user:profiles(id,name)'
        )
        .order('id');
      if (error) throw error;
      return data as DefectRecord[];
    },
    staleTime: 5 * 60_000,
  });
}

/** Получить дефект по ID */
export interface DefectWithFiles extends DefectRecord {
  attachments: any[];
}

export function useDefect(id?: number) {
  return useQuery<DefectWithFiles | null>({
    queryKey: ['defect', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          'id, description, defect_type_id, defect_status_id, brigade_id, contractor_id, received_at, fixed_at, fixed_by, attachment_ids, created_at,' +
          ' defect_type:defect_types(id,name), defect_status:defect_statuses(id,name,color), fixed_by_user:profiles(id,name)'
        )
        .eq('id', id as number)
        .single();
      if (error) throw error;
      let attachments: any[] = [];
      if (data?.attachment_ids?.length) {
        attachments = await getAttachmentsByIds(data.attachment_ids);
      }
      return { ...(data as DefectRecord), attachments } as DefectWithFiles;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить статусы дефектов по их идентификаторам.
 * Возвращает `id` и название статуса.
 */
export function useDefectsByIds(ids?: number[]) {
  return useQuery<{ id: number; statusName: string | null }[]>({
    queryKey: ['defects-by-ids', (ids ?? []).join(',')],
    enabled: Array.isArray(ids) && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, defect_status:defect_statuses(name)')
        .in('id', ids as number[]);
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        id: d.id,
        statusName: d.defect_status?.name ?? null,
      }));
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить дефекты по их идентификаторам со связанными названиями
 * типа и статуса.
 */
export function useDefectsWithNames(ids?: number[]) {
  return useQuery<DefectWithNames[]>({
    queryKey: ['defects-with-names', (ids ?? []).join(',')],
    enabled: Array.isArray(ids) && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          'id, description, defect_type_id, defect_status_id, brigade_id, contractor_id, received_at, fixed_at, fixed_by, defect_type:defect_types(id,name), defect_status:defect_statuses(id,name,color), fixed_by_user:profiles(id,name)'
        )
        .in('id', ids as number[]);
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        id: d.id,
        description: d.description,
        defect_type_id: d.defect_type_id,
        defect_status_id: d.defect_status_id,
        brigade_id: d.brigade_id,
        contractor_id: d.contractor_id,
        received_at: d.received_at,
        fixed_at: d.fixed_at,
        fixed_by: d.fixed_by,
        defectTypeName: d.defect_type?.name ?? null,
        defectStatusName: d.defect_status?.name ?? null,
        defectStatusColor: d.defect_status?.color ?? null,
        fixedByUserName: d.fixed_by_user?.name ?? null,
      })) as DefectWithNames[];
    },
    staleTime: 5 * 60_000,
  });
}

/** Создать несколько дефектов и вернуть их ID */
export function useCreateDefects() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<number[], Error, NewDefect[]>({
    async mutationFn(defects) {
      if (!defects.length) return [];
      const { data, error } = await supabase
        .from(TABLE)
        .insert(defects)
        .select('id');
      if (error) throw error;
      return (data as { id: number }[]).map((d) => d.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
    onError: (e) => notify.error(e.message),
  });
}

/** Удалить дефект */
export function useDeleteDefect() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<number, Error, number>({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
    onError: (e) => notify.error(e.message),
  });
}

/** Обновить статус дефекта */
export function useUpdateDefectStatus() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<{ id: number; defect_status_id: number | null }, Error, { id: number; statusId: number | null }>({
    mutationFn: async ({ id, statusId }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ defect_status_id: statusId })
        .eq('id', id)
        .select('id, defect_status_id')
        .single();
      if (error) throw error;
      return data as { id: number; defect_status_id: number | null };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
    onError: (e) => notify.error(`Ошибка обновления статуса: ${e.message}`),
  });
}

/** Обновить признак устранения дефекта */

/** Обновить данные устранения дефекта */
export function useFixDefect() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: async ({
      id,
      brigade_id,
      contractor_id,
      fixed_at,
      attachments = [],
      removedAttachmentIds = [],
      updatedAttachments = [],
    }: {
      id: number;
      brigade_id: number | null;
      contractor_id: number | null;
      fixed_at: string | null;
      attachments: { file: File; type_id: number | null }[];
      removedAttachmentIds?: number[];
      updatedAttachments?: { id: number; type_id: number | null }[];
    }) => {
      const { data: current } = await supabase
        .from(TABLE)
        .select('attachment_ids')
        .eq('id', id)
        .single();
      let ids: number[] = current?.attachment_ids ?? [];
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
        ids = ids.filter((i) => !removedAttachmentIds.includes(Number(i)));
      }
      let uploaded: any[] = [];
      if (attachments.length) {
        uploaded = await addDefectAttachments(attachments, id);
        ids = ids.concat(uploaded.map((u) => u.id));
      }
      if (updatedAttachments.length) {
        for (const a of updatedAttachments) {
          await supabase
            .from('attachments')
            .update({ attachment_type_id: a.type_id })
            .eq('id', a.id);
        }
      }
      const userId = useAuthStore.getState().profile?.id ?? null;
      const { data: st } = await supabase
        .from('defect_statuses')
        .select('id')
        .ilike('name', '%провер%')
        .maybeSingle();
      const checkingId = st?.id ?? null;
      const { error } = await supabase
        .from(TABLE)
        .update({
          brigade_id,
          contractor_id,
          fixed_at,
          fixed_by: userId,
          defect_status_id: checkingId,
          attachment_ids: ids,
        })
        .eq('id', id);
      if (error) throw error;
      return uploaded;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: ['defect', vars.id] });
      qc.invalidateQueries({ queryKey: ['defects-by-ids'] });
      notify.success('Дефект обновлён');
    },
    onError: (e: any) => notify.error(`Ошибка обновления: ${e.message}`),
  });
}

export async function signedUrl(path: string, filename = ''): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60, { download: filename || undefined });
  if (error) throw error;
  return data.signedUrl;
}
