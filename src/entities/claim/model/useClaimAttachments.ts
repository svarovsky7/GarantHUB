import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { useNotify } from '@/shared/hooks/useNotify';
import { addClaimAttachments, ATTACH_BUCKET } from '@/entities/attachment';
import { TABLE, SUMMARY_TABLE } from './mappers';

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
