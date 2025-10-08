import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { LetterLink } from '@/shared/types/correspondence';

const LETTERS_TABLE = 'letters';
const LINKS_TABLE = 'letter_links';

/**
 * Получить все связи между письмами.
 */
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

/**
 * Связать письма (установить родителя для дочерних писем).
 */
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

/**
 * Отвязать письмо от родителя.
 */
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
