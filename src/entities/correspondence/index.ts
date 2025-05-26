import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CorrespondenceLetter,
  CorrespondenceAttachment,
  LetterLink,
} from '@/shared/types/correspondence';
import { uploadLetterAttachment, ATTACH_BUCKET } from '../attachment';
import { supabase } from '@/shared/api/supabaseClient';

const LETTERS_TABLE = 'letters';
const LINKS_TABLE = 'letter_links';
const ATTACH_TABLE = 'attachments';

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

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
          `id, project_id, case_id, number, letter_type_id, letter_date, subject, sender, receiver, created_at, attachments(id, storage_path, file_url, file_type, attachment_type_id)`
        )
        .order('id');
      if (error) throw error;
      const { data: links, error: linkErr } = await supabase
        .from(LINKS_TABLE)
        .select('parent_id, child_id');
      if (linkErr) throw linkErr;
      const map = new Map<number, number>();
      (links ?? []).forEach((lnk) => map.set(lnk.child_id, lnk.parent_id));
      return (data ?? []).map((row: any) => {
        const parent = map.get(row.id);
        const type = row.receiver ? 'outgoing' : 'incoming';
        const correspondent = row.receiver || row.sender || '';
        return {
          id: String(row.id),
          type,
          parent_id: parent != null ? String(parent) : null,
          responsible_user_id: null,
          letter_type_id: row.letter_type_id ?? null,
          project_id: row.project_id ?? null,
          unit_ids: [],
          number: row.number,
          date: row.letter_date,
          correspondent,
          subject: row.subject ?? '',
          content: '',
          attachments: row.attachments ?? [],
        } as CorrespondenceLetter;
      });
    },
    staleTime: 5 * 60_000,
  });
}

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
        case_id: 0,
        number: data.number,
        letter_type_id: data.letter_type_id,
        letter_date: data.date,
        subject: data.subject,
        sender: data.type === 'incoming' ? data.correspondent : null,
        receiver: data.type === 'outgoing' ? data.correspondent : null,
      };
      const { data: inserted, error } = await supabase
        .from(LETTERS_TABLE)
        .insert(letterData)
        .select('*')
        .single();
      if (error) throw error;
      const letterId = inserted.id as number;
      const files: CorrespondenceAttachment[] = [];
      if (attachments.length && payload.project_id) {
        for (const { file, type_id } of attachments) {
          const { path, type, url } = await uploadLetterAttachment(
            file,
            payload.project_id!
          );
          await supabase.from(ATTACH_TABLE).insert({
            letter_id: letterId,
            file_type: type,
            storage_path: path,
            file_url: url,
            attachment_type_id: type_id,
          });
          files.push({
            id: '',
            name: file.name,
            file_type: type,
            storage_path: path,
            file_url: url,
            attachment_type_id: type_id,
          });
        }
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
        responsible_user_id: null,
        letter_type_id: data.letter_type_id ?? null,
        project_id: data.project_id ?? null,
        unit_ids: [],
        number: data.number,
        date: data.date,
        correspondent: data.correspondent,
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
      const { data: attach } = await supabase
        .from(ATTACH_TABLE)
        .select('id, storage_path')
        .eq('letter_id', letterId);
      const paths = (attach ?? []).map((a) => a.storage_path).filter(Boolean);
      if (paths.length) {
        await supabase.storage.from(ATTACH_BUCKET).remove(paths);
        await supabase.from(ATTACH_TABLE).delete().eq('letter_id', letterId);
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
