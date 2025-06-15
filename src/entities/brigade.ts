import { supabase } from '@/shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Brigade } from '@/shared/types/brigade';

const TABLE = 'brigades';
const FIELDS = 'id, name, description, created_at';

const sanitize = (b: Partial<Brigade>) =>
  Object.fromEntries(
    Object.entries(b).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]),
  );

const insert = async (
  payload: Omit<Brigade, 'id' | 'created_at'>,
): Promise<Brigade> => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(sanitize(payload))
    .select(FIELDS)
    .single();
  if (error) throw error;
  return data as Brigade;
};

const patch = async ({
  id,
  updates,
}: {
  id: number;
  updates: Partial<Omit<Brigade, 'id' | 'created_at'>>;
}): Promise<Brigade> => {
  const { data, error } = await supabase
    .from(TABLE)
    .update(sanitize(updates))
    .eq('id', id)
    .select(FIELDS)
    .single();
  if (error) throw error;
  return data as Brigade;
};

const remove = async (id: number): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
};

export const useBrigades = () =>
  useQuery<Brigade[]>({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(FIELDS)
        .order('name');
      if (error) throw error;
      return (data ?? []) as Brigade[];
    },
    staleTime: 10 * 60_000,
  });

const mutation = <TVar, TRes>(fn: (vars: TVar) => Promise<TRes>) => () => {
  const qc = useQueryClient();
  return useMutation<TRes, Error, TVar>({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};

export const useAddBrigade = mutation(insert);
export const useUpdateBrigade = mutation(patch);
export const useDeleteBrigade = mutation(remove);
