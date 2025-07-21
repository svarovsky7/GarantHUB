import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import {
  CorrespondenceLetter,
  CorrespondenceAttachment,
  LetterLink,
} from '@/shared/types/correspondence';
import type { NewLetterFile } from '@/shared/types/letterFile';
import { addLetterAttachments, getAttachmentsByIds, ATTACH_BUCKET } from '@/entities/attachment';
import { supabase } from '@/shared/api/supabaseClient';
import { useNotify } from '@/shared/hooks/useNotify';

const LETTERS_TABLE = 'letters';
const LINKS_TABLE = 'letter_links';
const ATTACH_TABLE = 'attachments';
const LETTER_UNITS_TABLE = 'letter_units';
const LETTER_ATTACH_TABLE = 'letter_attachments';

async function getContactIds(name: string | null) {
  if (!name) return { personId: null, contractorId: null };
  const { data: person } = await supabase
    .from('persons')
    .select('id')
    .eq('full_name', name)
    .maybeSingle();
  if (person) return { personId: person.id as number, contractorId: null };
  const { data: contr } = await supabase
    .from('contractors')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  if (contr) return { personId: null, contractorId: contr.id as number };
  return { personId: null, contractorId: null };
}

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
  const { projectIds, onlyAssigned, enabled } = useProjectFilter();

  return useQuery({
    queryKey: [LETTERS_TABLE, projectIds.join(',')],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from(LETTERS_TABLE)
        .select(
          `id, project_id, number, letter_type_id, direction, status_id, letter_date, subject, content, sender_person_id, sender_contractor_id, receiver_person_id, receiver_contractor_id, responsible_user_id, created_at, created_by`
        );
      if (onlyAssigned) {
        query = query.in('project_id', projectIds.length ? projectIds : [-1]);
      }
      const { data, error } = await query.order('id', { ascending: false });
      if (error) throw error;

      const letterIds = (data ?? []).map((r: any) => r.id) as number[];

      const { data: links, error: linkErr } = await supabase
        .from(LINKS_TABLE)
        .select('id, parent_id, child_id');
      if (linkErr) throw linkErr;

      const { data: unitRows, error: unitErr } = letterIds.length
        ? await supabase
            .from(LETTER_UNITS_TABLE)
            .select('letter_id, unit_id')
            .in('letter_id', letterIds)
        : { data: [], error: null };
      if (unitErr) throw unitErr;
      const unitMap: Record<number, number[]> = {};
      (unitRows ?? []).forEach((u: any) => {
        if (!unitMap[u.letter_id]) unitMap[u.letter_id] = [];
        unitMap[u.letter_id].push(u.unit_id);
      });

      const { data: attachRows, error: attErr } = letterIds.length
        ? await supabase
            .from(LETTER_ATTACH_TABLE)
            .select(
              'letter_id, attachments(id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by)'
            )
            .in('letter_id', letterIds)
        : { data: [], error: null };
      if (attErr) throw attErr;
      const attachmentsMap: Record<number, CorrespondenceAttachment[]> = {};
      (attachRows ?? []).forEach((row: any) => {
        const file = row.attachments;
        if (!file) return;
        let name = file.original_name;
        if (!name) {
          try {
            name = decodeURIComponent(
              file.storage_path.split('/').pop()?.replace(/^\d+_/, '') || file.storage_path,
            );
          } catch {
            name = file.storage_path;
          }
        }
        const arr = attachmentsMap[row.letter_id] ?? [];
        arr.push({
          id: String(file.id),
          name,
          mime_type: file.file_type,
          storage_path: file.storage_path,
          path: file.file_url,
        } as CorrespondenceAttachment);
        attachmentsMap[row.letter_id] = arr;
      });

      const personIds = Array.from(
        new Set((data ?? []).flatMap((r: any) => [r.sender_person_id, r.receiver_person_id].filter(Boolean)))
      );
      const contractorIds = Array.from(
        new Set((data ?? []).flatMap((r: any) => [r.sender_contractor_id, r.receiver_contractor_id].filter(Boolean)))
      );
      const personsMap: Record<number, string> = {};
      if (personIds.length) {
        const { data: persons, error: pErr } = await supabase
          .from('persons')
          .select('id, full_name')
          .in('id', personIds as number[]);
        if (pErr) throw pErr;
        (persons ?? []).forEach((p: any) => {
          personsMap[p.id] = p.full_name;
        });
      }
      const contractorsMap: Record<number, string> = {};
      if (contractorIds.length) {
        const { data: cons, error: cErr } = await supabase
          .from('contractors')
          .select('id, name')
          .in('id', contractorIds as number[]);
        if (cErr) throw cErr;
        (cons ?? []).forEach((c: any) => {
          contractorsMap[c.id] = c.name;
        });
      }
      const linkMap = new Map<number, number>();
      (links ?? []).forEach((lnk) => linkMap.set(lnk.child_id, lnk.parent_id));
      return (data ?? []).map((row: any) => {
        const type =
          (row.direction as 'incoming' | 'outgoing') ||
          (row.receiver_person_id != null || row.receiver_contractor_id != null
            ? 'outgoing'
            : 'incoming');
        const sender =
          personsMap[row.sender_person_id] ||
          contractorsMap[row.sender_contractor_id] ||
          '';
        const receiver =
          personsMap[row.receiver_person_id] ||
          contractorsMap[row.receiver_contractor_id] ||
          '';
        const attachments = attachmentsMap[row.id] ?? [];
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
          unit_ids: unitMap[row.id] ?? [],
          attachment_ids: attachments.map((a) => Number(a.id)),
          number: row.number,
          date: row.letter_date,
          sender,
          receiver,
          subject: row.subject ?? '',
          content: row.content ?? '',
          created_by: row.created_by ?? null,
          created_at: row.created_at ?? null,

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
          mime_type: u.file_type,
          storage_path: u.storage_path,
          path: u.file_url,
        }));
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

export function useLetter(letterId: number | string | undefined) {
  const id = Number(letterId);
  return useQuery({
    queryKey: ['letter', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(LETTERS_TABLE)
        .select(
          `id, project_id, number, letter_type_id, direction, status_id, letter_date, subject, content, sender_person_id, sender_contractor_id, receiver_person_id, receiver_contractor_id, responsible_user_id, created_at, created_by`
        )
        .eq('id', id)
        .single();
      if (error) throw error;
      const { data: link } = await supabase
        .from(LINKS_TABLE)
        .select('parent_id')
        .eq('child_id', id)
        .maybeSingle();
      const type =
        (data?.direction as 'incoming' | 'outgoing') ||
        (data?.receiver_person_id != null || data?.receiver_contractor_id != null
          ? 'outgoing'
          : 'incoming');
      const sender =
        (data?.sender_person_id
          ? (
              await supabase
                .from('persons')
                .select('full_name')
                .eq('id', data.sender_person_id)
                .maybeSingle()
            ).data?.full_name
          : null) ??
        (
          await supabase
            .from('contractors')
            .select('name')
            .eq('id', data.sender_contractor_id)
            .maybeSingle()
        ).data?.name ??
        '';
      const receiver =
        (data?.receiver_person_id
          ? (
              await supabase
                .from('persons')
                .select('full_name')
                .eq('id', data.receiver_person_id)
                .maybeSingle()
            ).data?.full_name
          : null) ??
        (
          await supabase
            .from('contractors')
            .select('name')
            .eq('id', data.receiver_contractor_id)
            .maybeSingle()
        ).data?.name ??
        '';
      const { data: units } = await supabase
        .from(LETTER_UNITS_TABLE)
        .select('unit_id')
        .eq('letter_id', id);
      const unitIds = (units ?? []).map((u: any) => u.unit_id);

      const { data: attachRows } = await supabase
        .from(LETTER_ATTACH_TABLE)
        .select('attachment_id, attachments(id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by)')
        .eq('letter_id', id);
      const attachments = (attachRows ?? []).map((row: any) => {
        const f = row.attachments;
        let name = f.original_name;
        if (!name) {
          try {
            name = decodeURIComponent(
              f.storage_path.split('/').pop()?.replace(/^\d+_/, '') || f.storage_path,
            );
          } catch {
            name = f.storage_path;
          }
        }
        return {
          id: String(f.id),
          name,
          file_type: f.file_type,
          storage_path: f.storage_path,
          file_url: f.file_url,
        };
      });
      return {
        id: String(data!.id),
        type,
        parent_id: link?.parent_id != null ? String(link.parent_id) : null,
        responsible_user_id: data?.responsible_user_id ? String(data.responsible_user_id) : null,
        status_id: data?.status_id ?? null,
        letter_type_id: data?.letter_type_id ?? null,
        project_id: data?.project_id ?? null,
        unit_ids: unitIds,
        attachment_ids: attachments.map((f) => Number(f.id)),
        number: data!.number,
        date: data!.letter_date,
        sender,
        receiver,
        subject: data?.subject ?? '',
        content: data?.content ?? '',
        created_by: data?.created_by ?? null,
        created_at: data?.created_at ?? null,
        attachments,
      } as CorrespondenceLetter & { attachments: any[] };
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

export async function removeLetterAttachmentsBulk(
  letterId: number,
  attachmentIds: number[],
): Promise<void> {
  if (attachmentIds.length === 0) return;
  const { data: atts } = await supabase
    .from(ATTACH_TABLE)
    .select('storage_path')
    .in('id', attachmentIds);
  const paths = (atts ?? [])
    .map((a: any) => a.storage_path)
    .filter(Boolean);
  if (paths.length) {
    await supabase.storage.from(ATTACH_BUCKET).remove(paths);
  }
  await supabase.from(ATTACH_TABLE).delete().in('id', attachmentIds);
  await supabase
    .from(LETTER_ATTACH_TABLE)
    .delete()
    .eq('letter_id', letterId)
    .in('attachment_id', attachmentIds);
}

export async function signedUrl(path: string, filename = ''): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60, { download: filename || undefined });
  if (error) throw error;
  return data.signedUrl;
}

export async function signedUrlForPreview(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}
