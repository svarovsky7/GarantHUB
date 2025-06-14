import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CorrespondenceLetter,
  CorrespondenceAttachment,
  LetterLink,
} from '@/shared/types/correspondence';
import type { NewLetterFile } from '@/shared/types/letterFile';
import { addLetterAttachments, getAttachmentsByIds, ATTACH_BUCKET } from '../attachment';
import { supabase } from '@/shared/api/supabaseClient';
import { useNotify } from '@/shared/hooks/useNotify';

const LETTERS_TABLE = 'letters';
const LINKS_TABLE = 'letter_links';
const ATTACH_TABLE = 'attachments';

export function useLetterLinks() {
  return useQuery({
    queryKey: [LINKS_TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(LINKS_TABLE)
        .select('id, parent_id, child_id');
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
          `id, project_id, number, letter_type_id, status_id, letter_date, subject, content, sender, receiver, responsible_user_id, unit_ids, attachment_ids, created_at`
        )
        .order('id');
      if (error) throw error;
      const { data: links, error: linkErr } = await supabase
        .from(LINKS_TABLE)
        .select('id, parent_id, child_id');
      if (linkErr) throw linkErr;
      const allIds = Array.from(
        new Set((data ?? []).flatMap((r: any) => r.attachment_ids || [])),
      );
      let attachmentsMap: Record<number, CorrespondenceAttachment> = {};
      if (allIds.length) {
        const { data: files, error: attErr } = await supabase
          .from(ATTACH_TABLE)
          .select('id, storage_path, file_url, file_type, attachment_type_id, original_name')
          .in('id', allIds);
        if (attErr) throw attErr;
        (files ?? []).forEach((a: any) => {
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
          status_id: row.status_id ?? null,
          letter_type_id: row.letter_type_id ?? null,
          project_id: row.project_id ?? null,
          unit_ids: (row.unit_ids ?? []) as number[],
          attachment_ids: row.attachment_ids ?? [],
          number: row.number,
          date: row.letter_date,
          sender,
          receiver,
          subject: row.subject ?? '',
          content: row.content ?? '',

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
        status_id: data.status_id ?? null,
        letter_date: data.date,
        subject: data.subject,
        content: data.content,
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
      if (attachments.length) {
        const uploaded = await addLetterAttachments(attachments, letterId);
        files = uploaded.map((u) => ({
          id: String(u.id),
          name:
            u.original_name ||
            (() => {
              try {
                return decodeURIComponent(
                  u.storage_path.split('/').pop()?.replace(/^\d+_/, '') ||
                    u.storage_path,
                );
              } catch {
                return u.storage_path;
              }
            })(),
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
        : { data: [] };
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

export function useLetter(letterId: number | string | undefined) {
  const id = Number(letterId);
  return useQuery({
    queryKey: ['letter', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(LETTERS_TABLE)
        .select(
          `id, project_id, number, letter_type_id, status_id, letter_date, subject, content, sender, receiver, responsible_user_id, unit_ids, attachment_ids`
        )
        .eq('id', id)
        .single();
      if (error) {
        console.error('useLetter query error:', error);
        throw error;
      }
      console.debug('useLetter fetched data:', data);
      const { data: link } = await supabase
        .from(LINKS_TABLE)
        .select('parent_id')
        .eq('child_id', id)
        .maybeSingle();
      const type = data?.receiver ? 'outgoing' : 'incoming';
      const sender = data?.sender || '';
      const receiver = data?.receiver || '';
      let attachments: any[] = [];
      if (data?.attachment_ids?.length) {
        attachments = await getAttachmentsByIds(data.attachment_ids);
      }
      const result = {
        id: String(data!.id),
        type,
        parent_id: link?.parent_id != null ? String(link.parent_id) : null,
        responsible_user_id: data?.responsible_user_id ? String(data.responsible_user_id) : null,
        status_id: data?.status_id ?? null,
        letter_type_id: data?.letter_type_id ?? null,
        project_id: data?.project_id ?? null,
        unit_ids: (data?.unit_ids ?? []) as number[],
        attachment_ids: data?.attachment_ids ?? [],
        number: data!.number,
        date: data!.letter_date,
        sender,
        receiver,
        subject: data?.subject ?? '',
        content: data?.content ?? '',
        attachments,
      } as CorrespondenceLetter & { attachments: any[] };
      console.debug('useLetter normalized result:', result);
      return result;
    },
    staleTime: 5 * 60_000,
  });
}

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
        .from(LETTERS_TABLE)
        .select('attachment_ids')
        .eq('id', id)
        .single();
      let ids: number[] = current?.attachment_ids ?? [];
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
        ids = ids.filter((i) => !removedAttachmentIds.includes(Number(i)));
      }
      if (Object.keys(updates).length) {
        const { error } = await supabase
          .from(LETTERS_TABLE)
          .update(updates)
          .eq('id', id);
        if (error) throw error;
      }
      if (updatedAttachments.length) {
        for (const a of updatedAttachments) {
          await supabase
            .from(ATTACH_TABLE)
            .update({ attachment_type_id: a.type_id })
            .eq('id', a.id);
        }
      }
      let uploaded: any[] = [];
      if (newAttachments.length) {
        uploaded = await addLetterAttachments(newAttachments, id);
        ids = ids.concat(uploaded.map((u) => u.id));
      }
      if (
        Object.keys(updates).length ||
        removedAttachmentIds.length ||
        newAttachments.length ||
        updatedAttachments.length
      ) {
        const { error } = await supabase
          .from(LETTERS_TABLE)
          .update({ attachment_ids: ids })
          .eq('id', id);
        if (error) throw error;
      }
      return uploaded;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [LETTERS_TABLE] });
      qc.invalidateQueries({ queryKey: ['letter', vars.id] });
    },
  });
}
