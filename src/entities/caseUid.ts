import { supabase } from '@/shared/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { CaseUid } from '@/shared/types/caseUid';

const TABLE = 'case_uids';

/** Получить список уникальных идентификаторов дел */
export const useCaseUids = () => {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('case_uids')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE },
        () => qc.invalidateQueries({ queryKey: [TABLE] }),
      );
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [qc]);
  return useQuery({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLE).select('id, uid').order('uid');
      if (error) throw error;
      return (data ?? []) as CaseUid[];
    },
    staleTime: 10 * 60_000,
  });
};

/** Возвращает id существующего идентификатора либо создаёт новый */
export async function getOrCreateCaseUid(uid: string): Promise<number> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id')
    .eq('uid', uid)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  if (data?.id) return data.id as number;
  const { data: inserted, error: insErr } = await supabase
    .from(TABLE)
    .insert({ uid })
    .select('id')
    .single();
  if (insErr) throw insErr;
  return inserted!.id as number;
}
