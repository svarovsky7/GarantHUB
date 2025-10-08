import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useNotify } from '@/shared/hooks/useNotify';
import { addDefectAttachments, ATTACH_BUCKET } from '@/entities/attachment';
import { useAuthStore } from '@/shared/store/authStore';
import type { DefectRecord } from '@/shared/types/defect';
import type { NewDefect } from './types';

const TABLE = 'defects';
const SUMMARY_TABLE = 'defects_summary';

/**
 * Создать несколько дефектов одним запросом и вернуть массив их идентификаторов.
 */
export function useCreateDefects() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<number[], Error, NewDefect[]>({
    async mutationFn(defects) {
      if (!defects.length) return [];
      const userId = useAuthStore.getState().profile?.id ?? null;
      const rows = defects.map((d) => ({
        ...d,
        created_by: d.created_by ?? userId,
      }));
      const { data, error } = await supabase
        .from(TABLE)
        .insert(rows)
        .select('id');
      if (error) throw error;
      return (data as { id: string | number }[]).map((d) => Number(d.id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
    },
    onError: (e) => notify.error(e.message),
  });
}

/**
 * Обновить данные дефекта
 */
export function useUpdateDefect() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<
        Pick<
          DefectRecord,
          | 'description'
          | 'type_id'
          | 'status_id'
          | 'brigade_id'
          | 'contractor_id'
          | 'is_warranty'
          | 'received_at'
          | 'fixed_at'
        >
      >;
    }) => {
      const userId = useAuthStore.getState().profile?.id ?? null;
      const { error } = await supabase
        .from(TABLE)
        .update({ ...updates, updated_by: userId ?? undefined })
        .eq('id', id);
      if (error) throw error;
      return { id, ...updates };
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      qc.invalidateQueries({ queryKey: ['defects-with-names'] });
      qc.invalidateQueries({ queryKey: ['defect', variables.id] });
      console.log(`[useUpdateDefect] Successfully updated defect ${variables.id}`);
    },
    onError: (e: any) => notify.error(`Ошибка обновления дефекта: ${e.message}`),
  });
}

/**
 * Удалить дефект
 */
export function useDeleteDefect() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<number, Error, number>({
    mutationFn: async (id: number) => {
      // Remove defect from related claims to keep data consistent
      await supabase.from('claim_defects').delete().eq('defect_id', id);

      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      qc.invalidateQueries({ queryKey: ['defect', id] });
      qc.invalidateQueries({ queryKey: ['defects-with-names'] });
      qc.invalidateQueries({ queryKey: ['defects-by-ids'] });
      qc.invalidateQueries({ queryKey: ['claims'] });
    },
    onError: (e) => notify.error(e.message),
  });
}

/**
 * Добавить вложения к существующему дефекту
 */
export function useAddDefectAttachments() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: async ({ defectId, files }: { defectId: number; files: File[] }) => {
      const uploaded = await addDefectAttachments(
        files.map((f) => ({ file: f, type_id: null, description: undefined })),
        defectId,
      );
      if (uploaded.length) {
        const rows = uploaded.map((u) => ({ defect_id: defectId, attachment_id: u.id }));
        await supabase.from('defect_attachments').insert(rows);
        await supabase
          .from(TABLE)
          .update({ updated_by: useAuthStore.getState().profile?.id ?? undefined })
          .eq('id', defectId);
      }
      return uploaded;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['defect', vars.defectId] });
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      notify.success('Файлы загружены');
    },
    onError: (e: any) => notify.error(`Ошибка загрузки файлов: ${e.message}`),
  });
}

/**
 * Удалить одно вложение дефекта
 */
export function useRemoveDefectAttachment() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<void, Error, { defectId: number; attachmentId: number }>({
    mutationFn: async ({ defectId, attachmentId }) => {
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
        .from('defect_attachments')
        .delete()
        .eq('defect_id', defectId)
        .eq('attachment_id', attachmentId);
      await supabase
        .from(TABLE)
        .update({ updated_by: useAuthStore.getState().profile?.id ?? undefined })
        .eq('id', defectId);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['defect', vars.defectId] });
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      notify.success('Файл удалён');
    },
    onError: (e) => notify.error(`Ошибка удаления файла: ${e.message}`),
  });
}
