import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CorrespondenceLetter,
  CorrespondenceAttachment,
} from '@/shared/types/correspondence';
import {
  uploadCorrespondenceAttachment,
  ATTACH_BUCKET,
} from '../attachment';
import { supabase } from '@/shared/api/supabaseClient';

const LS_KEY = 'correspondenceLetters';



function loadLetters(): CorrespondenceLetter[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as any[]) : [];
    return arr.map((l) => ({
      ...l,
      unit_ids: Array.isArray(l.unit_ids)
        ? l.unit_ids
        : l.unit_id
        ? [l.unit_id]
        : [],
      attachments: Array.isArray(l.attachments)
        ? l.attachments.map((a: any) => ({
            id: a.id,
            name: a.name,
            file_type: a.file_type,
            storage_path: a.storage_path,
            file_url: a.file_url,
            attachment_type_id: a.attachment_type_id ?? null,
          }))
        : [],
    }));
  } catch {
    return [];
  }
}

function saveLetters(letters: CorrespondenceLetter[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(letters));
}

export function useLetters() {
  return useQuery({
    queryKey: [LS_KEY],
    queryFn: async () => loadLetters(),
  });
}

export function useAddLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Omit<CorrespondenceLetter, 'id' | 'attachments'> & {
        attachments?: { file: File; type_id: number | null }[];
      },
    ) => {
      const letters = loadLetters();
      const attachments: CorrespondenceAttachment[] = await Promise.all(
        (payload.attachments ?? []).map(async ({ file, type_id }) => {
          const { path, type, url } = await uploadCorrespondenceAttachment(
            file,
            payload.project_id ?? 'common',
          );
          return {
            id: Date.now().toString() + Math.random().toString(16).slice(2),
            name: file.name,
            file_type: type,
            storage_path: path,
            file_url: url,
            attachment_type_id: type_id,
          } as CorrespondenceAttachment;
        }),
      );
      const newLetter: CorrespondenceLetter = {
        ...(payload as any),
        id: Date.now().toString(),
        attachments,
      };
      letters.push(newLetter);
      saveLetters(letters);
      return newLetter;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LS_KEY] });
    },
  });
}

export function useDeleteLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const letters = loadLetters();
      const letter = letters.find((l) => l.id === id);
      if (letter?.attachments?.length) {
        await supabase.storage
          .from(ATTACH_BUCKET)
          .remove(letter.attachments.map((a) => a.storage_path));
      }
      const updated = letters.filter((l) => l.id !== id);
      saveLetters(updated);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LS_KEY] });
    },
  });
}
