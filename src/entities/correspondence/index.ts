import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CorrespondenceLetter,
  CorrespondenceAttachment,
  LetterLink,
} from '@/shared/types/correspondence';
import { addLetterAttachments, ATTACH_BUCKET } from '../attachment';
import { supabase } from '@/shared/api/supabaseClient';

const LETTERS_TABLE = 'letters';
const LINKS_TABLE = 'letter_links';
const ATTACH_TABLE = 'attachments';

export function useLetterLinks() {
  return useQuery({
    queryKey: [LINKS_TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(LINKS_TABLE)
        .select('parent_id, child_id');
      if (error) throw error;
      return (data ?? []) as LetterLink[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useLetters() {
  return useQuery({
    queryKey: [LETTERS_TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(LETTERS_TABLE)
        .select(
          `id, project_id, number, letter_type_id, letter_date, subject, sender, receiver, responsible_user_id, unit_ids, attachment_ids, created_at`
        )
        .order('id');
      if (error) throw error;
      const { data: links, error: linkErr } = await supabase
        .from(LINKS_TABLE)
        .select('parent_id, child_id');
      if (linkErr) throw linkErr;
      const allIds = Array.from(
        new Set((data ?? []).flatMap((r: any) => r.attachment_ids || [])),
      );
      let attachmentsMap: Record<number, CorrespondenceAttachment> = {};
      if (allIds.length) {
        const { data: files, error: attErr } = await supabase
          .from(ATTACH_TABLE)
          .select('id, storage_path, file_url, file_type, attachment_type_id')
          .in('id', allIds);
        if (attErr) throw attErr;
        (files ?? []).forEach((a: any) => {
          let name = a.storage_path;
          try {
            name = decodeURIComponent(
              a.storage_path.split('/').pop()?.replace(/^\d+_/, '') ||
                a.storage_path,
            );
          } catch {
            /* ignore */
          }
          attachmentsMap[a.id] = {
            id: String(a.id),
            name,
            file_type: a.file_type,
            storage_path: a.storage_path,
            file_url: a.file_url,
            attachment_type_id: a.attachment_type_id ?? null,
          } as CorrespondenceAttachment;
        });
      }
      const linkMap = new Map<number, number>();
      (links ?? []).forEach((lnk) => linkMap.set(lnk.child_id, lnk.parent_id));
      return (data ?? []).map((row: any) => {
        const type = row.receiver ? 'outgoing' : 'incoming';
        const sender = row.sender || '';
        const receiver = row.receiver || '';
        const attachments = (row.attachment_ids || [])
          .map((id: number) => attachmentsMap[id])
          .filter(Boolean);

        return {
          id: String(row.id),
          type,
          parent_id: linkMap.get(row.id) != null ? String(linkMap.get(row.id)) : null,
          responsible_user_id: row.responsible_user_id
            ? String(row.responsible_user_id)
            : null,
          letter_type_id: row.letter_type_id ?? null,
          project_id: row.project_id ?? null,
          unit_ids: (row.unit_ids ?? []) as number[],
          attachment_ids: row.attachment_ids ?? [],
          number: row.number,
          date: row.letter_date,
          sender,
          receiver,
          subject: row.subject ?? '',
          content: '',

          attachments,
        } as CorrespondenceLetter;
      });
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Создать письмо вместе с вложениями и опциональной связью.
 * Возвращает мутацию React Query, которая после успешного
 * выполнения инвалидаирует кэш писем и связей.
 */
export function useAddLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Omit<CorrespondenceLetter, 'id' | 'attachments'> & {
        attachments?: { file: File; type_id: number | null }[];
      }
    ) => {
      const { attachments = [], parent_id, ...data } = payload as any;


      const letterData = {
        project_id: data.project_id,
        number: data.number,
        letter_type_id: data.letter_type_id,
        letter_date: data.date,
        subject: data.subject,
        sender: data.sender,
        receiver: data.receiver,
        // null в случае отсутствия выбранного сотрудника
        responsible_user_id: data.responsible_user_id ?? null,
        unit_ids: data.unit_ids,
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
      if (attachments.length && payload.project_id) {
        const uploaded = await addLetterAttachments(
          attachments,
          payload.project_id!
        );
        files = uploaded.map((u) => ({
          id: String(u.id),
          name: u.storage_path.split('/').pop() || u.storage_path,
          file_type: u.file_type,
          storage_path: u.storage_path,
          file_url: u.file_url,
          attachment_type_id: u.attachment_type_id ?? null,
        }));
        attachmentIds = uploaded.map((u) => u.id);
        await supabase
          .from(LETTERS_TABLE)
          .update({ attachment_ids: attachmentIds })
          .eq('id', letterId);
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
        letter_type_id: data.letter_type_id ?? null,
        project_id: data.project_id ?? null,
        unit_ids: data.unit_ids ?? [],
        attachment_ids: attachmentIds,
        number: data.number,
        date: data.date,
        sender: data.sender,
        receiver: data.receiver,
        subject: data.subject,
        content: '',

        attachments: files,
      } as CorrespondenceLetter;
    },
  });
}

export function useDeleteLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const letterId = Number(id);
      const { data: letter } = await supabase
        .from(LETTERS_TABLE)
        .select('attachment_ids, project_id')
        .eq('id', letterId)
        .single();
      const ids = (letter?.attachment_ids ?? []) as number[];
      const { data: attach } = ids.length
        ? await supabase
            .from(ATTACH_TABLE)
            .select('id, storage_path')
            .in('id', ids)
        : { data: [], error: null };
      const paths = (attach ?? []).map((a) => a.storage_path).filter(Boolean);
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

export function useLinkLetters() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, childIds }: { parentId: string; childIds: string[] }) => {
      const ids = childIds.map((c) => Number(c));
      if (ids.length === 0) return;
      await supabase
        .from(LINKS_TABLE)
        .delete()
        .in('child_id', ids);
      const rows = ids.map((child_id) => ({ parent_id: Number(parentId), child_id }));
      await supabase.from(LINKS_TABLE).insert(rows);
      qc.invalidateQueries({ queryKey: [LINKS_TABLE] });
      qc.invalidateQueries({ queryKey: [LETTERS_TABLE] });
    },
  });
}

export function useUnlinkLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const childId = Number(id);
      await supabase.from(LINKS_TABLE).delete().eq('child_id', childId);
      qc.invalidateQueries({ queryKey: [LINKS_TABLE] });
      qc.invalidateQueries({ queryKey: [LETTERS_TABLE] });
    },
  });
}

export async function signedLetterUrl(path: string, filename = '') {
  const { data, error } = await supabase
    .storage.from(ATTACH_BUCKET)
    .createSignedUrl(path, 60, { download: filename || undefined });
  if (error) throw error;
  return data.signedUrl;
}

export function useUpdateLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
      newAttachments = [],
      removedAttachmentIds = [],
      updatedAttachments = [],
    }: {
      id: string;
      updates: Partial<Omit<CorrespondenceLetter, 'id' | 'attachments'>>;
      newAttachments?: { file: File; type_id: number | null }[];
      removedAttachmentIds?: string[];
      updatedAttachments?: { id: string; type_id: number | null }[];
    }) => {
      const letterId = Number(id);
      const { data: current } = await supabase
        .from(LETTERS_TABLE)
        .select('attachment_ids, project_id')
        .eq('id', letterId)
        .single();
      let ids = (current?.attachment_ids ?? []) as number[];
      const projectId = updates.project_id ?? current?.project_id ?? null;

      if (removedAttachmentIds.length) {
        const { data: files } = await supabase
          .from(ATTACH_TABLE)
          .select('storage_path')
          .in('id', removedAttachmentIds.map(Number));
        if (files?.length) {
          await supabase.storage
            .from(ATTACH_BUCKET)
            .remove(files.map((f) => f.storage_path));
        }
        await supabase
          .from(ATTACH_TABLE)
          .delete()
          .in('id', removedAttachmentIds.map(Number));
        ids = ids.filter((a) => !removedAttachmentIds.map(Number).includes(a));
      }

      const letterData: Record<string, any> = {
        project_id: updates.project_id,
        number: updates.number,
        letter_type_id: updates.letter_type_id,
        letter_date: updates.date,
        subject: updates.subject,
        sender: updates.sender,
        receiver: updates.receiver,
        responsible_user_id: updates.responsible_user_id,
        unit_ids: updates.unit_ids,
      };
      const sanitized = Object.fromEntries(
        Object.entries(letterData).filter(([, v]) => v !== undefined),
      );

      if (updatedAttachments.length) {
        for (const a of updatedAttachments) {
          await supabase
            .from(ATTACH_TABLE)
            .update({ attachment_type_id: a.type_id })
            .eq('id', Number(a.id));
        }
      }

      if (newAttachments.length && projectId) {
        const uploaded = await addLetterAttachments(newAttachments, projectId);
        ids = ids.concat(uploaded.map((u) => u.id));
      }

      await supabase
        .from(LETTERS_TABLE)
        .update({ ...sanitized, attachment_ids: ids })
        .eq('id', letterId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LETTERS_TABLE] });
    },
  });
}
