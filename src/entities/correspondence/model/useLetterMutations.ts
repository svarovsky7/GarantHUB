import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useNotify } from '@/shared/hooks/useNotify';
import type { CorrespondenceLetter, CorrespondenceAttachment } from '@/shared/types/correspondence';
import type { NewLetterFile } from '@/shared/types/letterFile';
import { addLetterAttachments, ATTACH_BUCKET } from '@/entities/attachment';
import { getContactIds } from '../lib/contactResolver';
import { transformAttachment } from '../lib/letterTransformers';

const LETTERS_TABLE = 'letters';
const LINKS_TABLE = 'letter_links';
const ATTACH_TABLE = 'attachments';
const LETTER_UNITS_TABLE = 'letter_units';
const LETTER_ATTACH_TABLE = 'letter_attachments';

/**
 * Создать письмо вместе с вложениями и опциональной связью.
 */
export function useAddLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Omit<CorrespondenceLetter, 'id' | 'attachments'> & {
        attachments?: { file: File; type_id: number | null; description?: string }[];
      }
    ) => {
      const { attachments = [], parent_id, ...data } = payload as any;

      const senderIds = await getContactIds(data.sender);
      const receiverIds = await getContactIds(data.receiver);

      const letterData = {
        project_id: data.project_id,
        number: data.number,
        letter_type_id: data.letter_type_id,
        direction: data.type,
        status_id: data.status_id ?? null,
        letter_date: data.date,
        subject: data.subject,
        content: data.content,
        sender_person_id: senderIds.personId,
        sender_contractor_id: senderIds.contractorId,
        receiver_person_id: receiverIds.personId,
        receiver_contractor_id: receiverIds.contractorId,
        // null в случае отсутствия выбранного сотрудника
        responsible_user_id: data.responsible_user_id ?? null,
        created_by: data.created_by ?? null,
      };
      const { data: inserted, error } = await supabase
        .from(LETTERS_TABLE)
        .insert(letterData)
        .select('*')
        .single();
      if (error) throw error;
      const letterId = inserted.id as number;
      let files: CorrespondenceAttachment[] = [];
      let attachmentIds: number[] = [];
      if (attachments.length) {
        const uploaded = await addLetterAttachments(
          attachments.map((a) => ({
            file: a.file,
            type_id: a.type_id,
            description: a.description,
          })),
          letterId,
        );
        files = uploaded.map((u) => transformAttachment(u));
        attachmentIds = uploaded.map((u) => u.id);
        if (attachmentIds.length) {
          const rows = attachmentIds.map((aid) => ({
            letter_id: letterId,
            attachment_id: aid,
          }));
          await supabase.from(LETTER_ATTACH_TABLE).insert(rows);
        }
      }
      if (data.unit_ids?.length) {
        const rows = data.unit_ids.map((uid: number) => ({
          letter_id: letterId,
          unit_id: uid,
        }));
        await supabase.from(LETTER_UNITS_TABLE).insert(rows);
      }
      if (parent_id) {
        await supabase
          .from(LINKS_TABLE)
          .insert({ parent_id: Number(parent_id), child_id: letterId });
      }
      qc.invalidateQueries({ queryKey: [LETTERS_TABLE] });
      qc.invalidateQueries({ queryKey: [LINKS_TABLE] });
      return {
        id: String(letterId),
        type: data.type,
        parent_id,
        responsible_user_id: data.responsible_user_id ?? null,
        status_id: data.status_id ?? null,
        letter_type_id: data.letter_type_id ?? null,
        project_id: data.project_id ?? null,
        unit_ids: data.unit_ids ?? [],
        attachment_ids: attachmentIds,
        number: data.number,
        date: data.date,
        sender: data.sender,
        receiver: data.receiver,
        subject: data.subject,
        content: data.content,
        created_by: inserted.created_by ?? null,
        created_at: inserted.created_at ?? null,

        attachments: files,
      } as CorrespondenceLetter;
    },
  });
}

/**
 * Обновить письмо с управлением вложениями.
 */
export function useUpdateLetter() {
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
      newAttachments?: NewLetterFile[];
      removedAttachmentIds?: number[];
      updatedAttachments?: { id: number; type_id: number | null }[];
      updates?: Partial<CorrespondenceLetter>;
    }) => {
      const { data: current } = await supabase
        .from(LETTER_ATTACH_TABLE)
        .select('attachment_id, attachments(storage_path)')
        .eq('letter_id', id);
      let ids: number[] = (current ?? []).map((r: any) => r.attachment_id);
      if (removedAttachmentIds.length) {
        const { data: atts } = await supabase
          .from(ATTACH_TABLE)
          .select('storage_path')
          .in('id', removedAttachmentIds);
        if (atts?.length)
          await supabase.storage
            .from(ATTACH_BUCKET)
            .remove(atts.map((a) => a.storage_path));
        await supabase.from(ATTACH_TABLE).delete().in('id', removedAttachmentIds);
        await supabase
          .from(LETTER_ATTACH_TABLE)
          .delete()
          .eq('letter_id', id)
          .in('attachment_id', removedAttachmentIds);
        ids = ids.filter((i) => !removedAttachmentIds.includes(Number(i)));
      }
      if (Object.keys(updates).length) {
        const upd: any = { ...updates };
        if (Object.prototype.hasOwnProperty.call(updates, 'sender')) {
          const ids = await getContactIds(updates.sender as string);
          upd.sender_person_id = ids.personId;
          upd.sender_contractor_id = ids.contractorId;
          delete upd.sender;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'receiver')) {
          const ids = await getContactIds(updates.receiver as string);
          upd.receiver_person_id = ids.personId;
          upd.receiver_contractor_id = ids.contractorId;
          delete upd.receiver;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'type')) {
          upd.direction = updates.type;
          delete upd.type;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'unit_ids')) {
          await supabase
            .from(LETTER_UNITS_TABLE)
            .delete()
            .eq('letter_id', id);
          if ((updates.unit_ids as number[] | undefined)?.length) {
            const rows = (updates.unit_ids as number[]).map((uid) => ({
              letter_id: id,
              unit_id: uid,
            }));
            await supabase.from(LETTER_UNITS_TABLE).insert(rows);
          }
          delete upd.unit_ids;
        }
        const { error } = await supabase
          .from(LETTERS_TABLE)
          .update(upd)
          .eq('id', id);
        if (error) throw error;
      }
      if (updatedAttachments.length) {
        // attachment type updates removed
      }
      let uploaded: any[] = [];
      if (newAttachments.length) {
        uploaded = await addLetterAttachments(
          newAttachments.map((f) => ({
            file: f.file,
            type_id: null,
            description: (f as any).description,
          })),
          id,
        );
        if (uploaded.length) {
          const rows = uploaded.map((u: any) => ({
            letter_id: id,
            attachment_id: u.id,
          }));
          await supabase.from(LETTER_ATTACH_TABLE).insert(rows);
        }
        ids = ids.concat(uploaded.map((u) => u.id));
      }
      if (removedAttachmentIds.length || newAttachments.length) {
        // links table updated in operations above
      }
      return uploaded;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [LETTERS_TABLE] });
      qc.invalidateQueries({ queryKey: ['letter', vars.id] });
    },
  });
}

/**
 * Удалить письмо вместе с вложениями и связями.
 */
export function useDeleteLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const letterId = Number(id);
      const { data: attach } = await supabase
        .from(LETTER_ATTACH_TABLE)
        .select('attachment_id, attachments(storage_path)')
        .eq('letter_id', letterId);
      const ids = (attach ?? []).map((a: any) => a.attachment_id);
      const paths = (attach ?? [])
        .map((a: any) => a.attachments?.storage_path)
        .filter(Boolean);
      if (paths.length) {
        await supabase.storage.from(ATTACH_BUCKET).remove(paths);
        await supabase.from(ATTACH_TABLE).delete().in('id', ids);
      }
      await supabase
        .from(LINKS_TABLE)
        .delete()
        .or(`parent_id.eq.${letterId},child_id.eq.${letterId}`);
      const { error } = await supabase
        .from(LETTERS_TABLE)
        .delete()
        .eq('id', letterId);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: [LETTERS_TABLE] });
      qc.invalidateQueries({ queryKey: [LINKS_TABLE] });
      return id;
    },
  });
}

/**
 * Обновить статус письма.
 */
export function useUpdateLetterStatus() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: async ({ id, statusId }: { id: string; statusId: number }) => {
      const { data, error } = await supabase
        .from(LETTERS_TABLE)
        .update({ status_id: statusId })
        .eq('id', Number(id))
        .select('id, status_id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LETTERS_TABLE] });
      notify.success('Статус письма обновлён');
    },
    onError: (e: any) => notify.error(`Ошибка обновления статуса: ${e.message}`),
  });
}

/**
 * Обновить направление письма (входящее/исходящее).
 */
export function useUpdateLetterDirection() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: async ({
      id,
      direction,
    }: {
      id: string;
      direction: 'incoming' | 'outgoing';
    }) => {
      const { data, error } = await supabase
        .from(LETTERS_TABLE)
        .update({ direction })
        .eq('id', Number(id))
        .select('id, direction')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LETTERS_TABLE] });
      notify.success('Тип письма обновлён');
    },
    onError: (e: any) =>
      notify.error(`Ошибка обновления типа письма: ${e.message}`),
  });
}
