import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CorrespondenceLetter,
  CorrespondenceAttachment,
} from '@/shared/types/correspondence';
import { uploadLetterAttachment, ATTACH_BUCKET } from '../attachment';
import { supabase } from '@/shared/api/supabaseClient';

const LS_KEY = 'correspondenceLetters';

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

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
      attachments: Array.isArray(l.attachments) ? l.attachments : [],
      parent_id: l.parent_id ?? null,
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
          if (payload.project_id) {
            const { path, type, url } = await uploadLetterAttachment(
              file,
              payload.project_id!,
            );
            return {
              id: Date.now().toString() + Math.random().toString(16).slice(2),
              name: file.name,
              file_type: type,
              storage_path: path,
              file_url: url,
              attachment_type_id: type_id,
            } as CorrespondenceAttachment;
          }
          return {
            id: Date.now().toString() + Math.random().toString(16).slice(2),
            name: file.name,
            file_type: file.type,
            storage_path: '',
            file_url: await readFileAsDataURL(file),
            attachment_type_id: type_id,
          } as CorrespondenceAttachment;
        }),
      );
      const newLetter: CorrespondenceLetter = {
        ...(payload as any),
        id: Date.now().toString(),
        attachments,
        parent_id: (payload as any).parent_id ?? null,
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
      if (letter && letter.attachments?.length) {
        const paths = letter.attachments
          .map((a) => a.storage_path)
          .filter((p) => !!p);
        if (paths.length) {
          await supabase.storage.from(ATTACH_BUCKET).remove(paths);
        }
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

export function useLinkLetters() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, childIds }: { parentId: string; childIds: string[] }) => {
      const letters = loadLetters();
      const map = new Map(letters.map((l) => [l.id, l]));
      childIds.forEach((id) => {
        const l = map.get(id);
        if (l) l.parent_id = parentId;
      });
      saveLetters(Array.from(map.values()));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LS_KEY] });
    },
  });
}
