import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useNotify } from '@/shared/hooks/useNotify';
import { addDefectAttachments, ATTACH_BUCKET } from '@/entities/attachment';
import { useAuthStore } from '@/shared/store/authStore';

const TABLE = 'defects';
const SUMMARY_TABLE = 'defects_summary';

/**
 * Обновить статус дефекта
 */
export function useUpdateDefectStatus() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<{ id: number; status_id: number | null }, Error, { id: number; statusId: number | null }>({
    mutationFn: async ({ id, statusId }) => {
      const userId = useAuthStore.getState().profile?.id ?? null;
      const { data, error } = await supabase
        .from(TABLE)
        .update({ status_id: statusId, updated_by: userId ?? undefined })
        .eq('id', id)
        .select('id, status_id')
        .single();
      if (error) throw error;
      return data as { id: number; status_id: number | null };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
    },
    onError: (e) => notify.error(`Ошибка обновления статуса: ${e.message}`),
  });
}

/**
 * Обновить данные устранения дефекта и проверить связанные претензии
 */
export function useFixDefect() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: async ({
      id,
      brigade_id,
      contractor_id,
      fixed_at,
      engineer_id,
      attachments = [],
      removedAttachmentIds = [],
      updatedAttachments = [],
    }: {
      id: number;
      brigade_id: number | null;
      contractor_id: number | null;
      fixed_at: string | null;
      engineer_id: string | null;
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
        uploaded = await addDefectAttachments(
          attachments.map((a: any) => ({
            file: a.file,
            type_id: a.type_id ?? null,
            description: a.description,
          })),
          id,
        );
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
          engineer_id,
          fixed_by: userId,
          status_id: checkingId,
          updated_by: userId ?? undefined,
        })
        .eq('id', id);
      if (error) throw error;

      // После обновления дефекта проверяем, не содержит ли претензия все дефекты в статусе "на проверку".
      const { data: claimRows } = await supabase
        .from('claim_defects')
        .select('claim_id')
        .eq('defect_id', id);
      const claimIds = (claimRows ?? []).map((r: any) => r.claim_id);

      if (claimIds.length) {
        const { data: claimStatusRow } = await supabase
          .from('statuses')
          .select('id')
          .ilike('name', '%провер%')
          .eq('entity', 'claim')
          .maybeSingle();
        const claimCheckingId = claimStatusRow?.id ?? null;

        if (claimCheckingId) {
          const updateIds: number[] = [];
          for (const cId of claimIds) {
            const { data: defRows } = await supabase
              .from('claim_defects')
              .select('defect_id')
              .eq('claim_id', cId);
            const defectIds = (defRows ?? []).map((d: any) => d.defect_id);

            const { data: statuses } = defectIds.length
              ? await supabase
                  .from('defects')
                  .select('statuses!fk_defects_status(name)')
                  .in('id', defectIds)
              : { data: [] };

            const allFixed = (statuses ?? []).every((s: any) => {
              const name = s.statuses?.name?.toLowerCase() ?? '';
              return /провер|закры/.test(name);
            });

            if (allFixed) updateIds.push(cId);
          }
          if (updateIds.length) {
            await supabase
              .from('claims')
              .update({ claim_status_id: claimCheckingId })
              .in('id', updateIds);
          }
        }
      }

      return uploaded;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      qc.invalidateQueries({ queryKey: ['defect', vars.id] });
      qc.invalidateQueries({ queryKey: ['defects-by-ids'] });
      qc.invalidateQueries({ queryKey: ['claims'] });
      notify.success('Дефект обновлён');
    },
    onError: (e: any) => notify.error(`Ошибка обновления: ${e.message}`),
  });
}

/**
 * Снять подтверждение об устранении дефекта и вернуть статус "В РАБОТЕ".
 */
export function useCancelDefectFix() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<number, Error, number>({
    async mutationFn(id) {
      const { data: st } = await supabase
        .from('statuses')
        .select('id')
        .ilike('name', '%работ%')
        .eq('entity', 'defect')
        .maybeSingle();
      const inWorkId = st?.id ?? null;

      const { error } = await supabase
        .from(TABLE)
        .update({
          brigade_id: null,
          contractor_id: null,
          fixed_at: null,
          fixed_by: null,
          status_id: inWorkId,
          updated_by: useAuthStore.getState().profile?.id ?? undefined,
        })
        .eq('id', id);
      if (error) throw error;

      // Обновление статусов претензий,
      // если допустим дефекты
      // больше не все подтверждены.
      const { data: claimRows } = await supabase
        .from('claim_defects')
        .select('claim_id')
        .eq('defect_id', id);
      const claimIds = (claimRows ?? []).map((r: any) => r.claim_id);

      if (claimIds.length) {
        const { data: clSt } = await supabase
          .from('statuses')
          .select('id')
          .ilike('name', '%работ%')
          .eq('entity', 'claim')
          .maybeSingle();
        const claimInWorkId = clSt?.id ?? null;

        if (claimInWorkId) {
          const updateIds: number[] = [];
          for (const cId of claimIds) {
            const { data: defRows } = await supabase
              .from('claim_defects')
              .select('defect_id')
              .eq('claim_id', cId);
            const defectIds = (defRows ?? []).map((d: any) => d.defect_id);

            const { data: statuses } = defectIds.length
              ? await supabase
                  .from('defects')
                  .select('statuses!fk_defects_status(name)')
                  .in('id', defectIds)
              : { data: [] };

            const allFixed = (statuses ?? []).every((s: any) => {
              const name = s.statuses?.name?.toLowerCase() ?? '';
              return /провер|закры/.test(name);
            });

            if (!allFixed) updateIds.push(cId);
          }
          if (updateIds.length) {
            await supabase
              .from('claims')
              .update({ claim_status_id: claimInWorkId })
              .in('id', updateIds);
          }
        }
      }

      return id;
    },
    onSuccess: (_id) => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      qc.invalidateQueries({ queryKey: ['defect', _id] });
      qc.invalidateQueries({ queryKey: ['defects-by-ids'] });
      qc.invalidateQueries({ queryKey: ['claims'] });
      notify.success('Подтверждение снято');
    },
    onError: (e: any) => notify.error(`Ошибка обновления: ${e.message}`),
  });
}
