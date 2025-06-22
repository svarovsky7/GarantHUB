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
  is_warranty: boolean;
  received_at: string | null;
  fixed_at: string | null;
  fixed_by: string | null;
}

const TABLE = 'defects';

/**
 * Получить все дефекты проекта без вложений.
 * Вложения загружаются отдельно при запросе конкретного дефекта.
 */
export function useDefects() {
  return useQuery<DefectRecord[]>({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          'id, description, defect_type_id, defect_status_id, brigade_id, contractor_id, is_warranty, received_at, fixed_at, fixed_by, created_at,' +
          ' defect_type:defect_types(id,name), defect_status:statuses(id,name,color), fixed_by_user:profiles(id,name)'
        )
        .order('id');
      if (error) throw error;
      return data as unknown as DefectRecord[];
    },
    staleTime: 5 * 60_000,
  });
}

/** Получить дефект по ID */
export interface DefectWithFiles extends DefectRecord {
  attachments: any[];
  defect_type?: { id: number; name: string } | null;
  defect_status?: { id: number; name: string; color: string | null } | null;
}

/**
 * Получить один дефект с вложениями и связными названиями
 * типа и статуса.
 */
export function useDefect(id?: number) {
  return useQuery<DefectWithFiles | null>({
    queryKey: ['defect', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          'id, description, defect_type_id, defect_status_id, brigade_id, contractor_id, is_warranty, received_at, fixed_at, fixed_by, created_at,' +
          ' defect_type:defect_types(id,name), defect_status:statuses(id,name,color), fixed_by_user:profiles(id,name)'
        )
        .eq('id', id as number)
        .single();
      if (error) throw error;
      const { data: attachRows, error: attachErr } = await supabase
        .from('defect_attachments')
        .select(
          'attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)'
        )
        .eq('defect_id', id as number);
      if (attachErr) throw attachErr;
      const attachments = (attachRows ?? []).map((r: any) => r.attachments);
      return { ...(data as any), attachments } as DefectWithFiles;
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
        .select('id, defect_status:statuses(name)')
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
          'id, description, defect_type_id, defect_status_id, brigade_id, contractor_id, is_warranty, received_at, fixed_at, fixed_by, defect_type:defect_types(id,name), defect_status:statuses(id,name,color), fixed_by_user:profiles(id,name)'
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
        is_warranty: d.is_warranty,
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
        .from('defect_attachments')
        .select('attachment_id, attachments(storage_path)')
        .eq('defect_id', id);
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
          .from('defect_attachments')
          .delete()
          .eq('defect_id', id)
          .in('attachment_id', removedAttachmentIds);
        ids = ids.filter((i) => !removedAttachmentIds.includes(Number(i)));
      }
      let uploaded: any[] = [];
      if (attachments.length) {
        uploaded = await addDefectAttachments(attachments, id);
        const rows = uploaded.map((u) => ({
          defect_id: id,
          attachment_id: u.id,
        }));
        if (rows.length) await supabase.from('defect_attachments').insert(rows);
        ids = ids.concat(uploaded.map((u) => u.id));
      }
      if (updatedAttachments.length) {
        // attachment type updates removed
      }
      const userId = useAuthStore.getState().profile?.id ?? null;
      const { data: st } = await supabase
        .from('statuses')
        .select('id')
        .ilike('name', '%провер%')
        .eq('entity', 'defect')
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
