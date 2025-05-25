import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CorrespondenceLetter,
  CorrespondenceAttachment,
  LetterLink,
} from '@/shared/types/correspondence';
import { uploadLetterAttachment, ATTACH_BUCKET } from '../attachment';
import { supabase } from '@/shared/api/supabaseClient';

const LS_KEY = 'correspondenceLetters';
const LINK_KEY = 'correspondenceLetterLinks';

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

function loadLinks(): LetterLink[] {
  try {
    const raw = localStorage.getItem(LINK_KEY);
    return raw ? (JSON.parse(raw) as LetterLink[]) : [];
  } catch {
    return [];
  }
}

function saveLinks(links: LetterLink[]) {
  localStorage.setItem(LINK_KEY, JSON.stringify(links));
}

export function useLetterLinks() {
  return useQuery({
    queryKey: [LINK_KEY],
    queryFn: async () => loadLinks(),
  });
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
      const links = loadLinks();
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
      if (newLetter.parent_id) {
        links.push({ parent_id: newLetter.parent_id, child_id: newLetter.id });
      }
      saveLetters(letters);
      saveLinks(links);
      return newLetter;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LS_KEY] });
      qc.invalidateQueries({ queryKey: [LINK_KEY] });
    },
  });
}

export function useDeleteLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const letters = loadLetters();
      let links = loadLinks();
      const letter = letters.find((l) => l.id === id);
      if (letter && letter.attachments?.length) {
        const paths = letter.attachments
          .map((a) => a.storage_path)
          .filter((p) => !!p);
        if (paths.length) {
          await supabase.storage.from(ATTACH_BUCKET).remove(paths);
        }
      }
      const updated = letters
        .filter((l) => l.id !== id)
        .map((l) =>
          l.parent_id === id ? { ...l, parent_id: null } : l,
        );
      links = links.filter(
        (link) => link.parent_id !== id && link.child_id !== id,
      );
      saveLetters(updated);
      saveLinks(links);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LS_KEY] });
      qc.invalidateQueries({ queryKey: [LINK_KEY] });
    },
  });
}

export function useLinkLetters() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, childIds }: { parentId: string; childIds: string[] }) => {
      const letters = loadLetters();
      let links = loadLinks().filter((lnk) => !childIds.includes(lnk.child_id));
      const map = new Map(letters.map((l) => [l.id, l]));
      childIds.forEach((id) => {
        const l = map.get(id);
        if (l) {
          l.parent_id = parentId;
          links.push({ parent_id: parentId, child_id: id });
        }
      });
      saveLetters(Array.from(map.values()));
      saveLinks(links);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LS_KEY] });
      qc.invalidateQueries({ queryKey: [LINK_KEY] });
    },
  });
}


export function useUnlinkLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const letters = loadLetters();
      let links = loadLinks();
      const map = new Map(letters.map((l) => [l.id, l]));
      const letter = map.get(id);
      if (letter) {
        letter.parent_id = null;
        map.set(id, letter);
      }
      links = links.filter((lnk) => lnk.child_id !== id);
      saveLetters(Array.from(map.values()));
      saveLinks(links);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LS_KEY] });
      qc.invalidateQueries({ queryKey: [LINK_KEY] });
    },
  });
}
