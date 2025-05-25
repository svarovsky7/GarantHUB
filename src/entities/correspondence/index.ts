import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CorrespondenceLetter } from '@/shared/types/correspondence';

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
    mutationFn: async (payload: Omit<CorrespondenceLetter, 'id'>) => {
      const letters = loadLetters();
      const newLetter = { ...payload, id: Date.now().toString() } as CorrespondenceLetter;
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
      const updated = letters.filter((l) => l.id !== id);
      saveLetters(updated);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LS_KEY] });
    },
  });
}
