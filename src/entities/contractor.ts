// --------------------------------------------------------
// Контрагенты — ГЛОБАЛЬНЫЕ (без project_id)
// --------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import type { Contractor } from '@/shared/types/contractor';

const TABLE  = 'contractors';
const FIELDS = `
  id, name, description, inn, phone, email, created_at
`;

/** trim + ''→null */
const sanitize = (o: Partial<Contractor>) =>
    Object.fromEntries(
        Object.entries(o)
            .filter(([k]) =>
                ['name', 'inn', 'phone', 'email', 'description'].includes(k),
            )
            .map(([k, v]) => [
                k,
                typeof v === 'string' ? v.trim() || null : v,
            ]),
    );

/**
 * Проверяем дубль по ИНН. Возвращает найденную компанию либо `null`.
 */
const findDuplicate = async (
    { inn }: { inn?: string | null },
    excludeId: number | null = null,
) => {
    if (!inn) return null;

    let query = supabase
        .from(TABLE)
        .select('id, name')
        .eq('inn', inn)
        .limit(1);

    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query.maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
};

/* ---------------- CRUD ---------------- */
const insert = async (
    payload: Omit<Contractor, 'id' | 'created_at'>,
): Promise<Contractor> => {
    const dup = await findDuplicate(payload);
    if (dup) {
        throw new Error(`Компания с таким ИНН уже есть: ${dup.name}`);
    }
    const { data, error } = await supabase
        .from(TABLE)
        .insert(sanitize(payload))
        .select(FIELDS)
        .single();
    if (error) throw error;
    return data;
};

const patch = async ({
    id,
    updates,
}: {
    id: number;
    updates: Partial<Omit<Contractor, 'id' | 'created_at'>>;
}): Promise<Contractor> => {
    const { data: current } = await supabase
        .from(TABLE)
        .select('inn, name')
        .eq('id', id)
        .single();

    const dup = await findDuplicate(
        { inn: updates.inn ?? current.inn },
        id,
    );
    if (dup) {
        throw new Error(`Компания с таким ИНН уже есть: ${dup.name}`);
    }

    const { data, error } = await supabase
        .from(TABLE)
        .update(sanitize(updates))
        .eq('id', id)
        .select(FIELDS)
        .single();
    if (error) throw error;
    return data;
};

const remove = async (id: number): Promise<void> => {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
};

/* ---------------- hooks ---------------- */
export const useContractors = () => {
    return useQuery<Contractor[]>({
        queryKey: [TABLE],
        queryFn : async () => {
            const { data, error } = await supabase
                .from(TABLE)
                .select(FIELDS)
                .order('name');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 10 * 60_000,
    });
};

const mutation = <TVars, TRes>(fn: (vars: TVars) => Promise<TRes>) => () => {
    const qc = useQueryClient();
    return useMutation<TRes, Error, TVars>({
        mutationFn : fn,
        onSuccess  : () => qc.invalidateQueries({ queryKey: [TABLE] }),
    });
};

export const useAddContractor    = mutation(insert);
export const useUpdateContractor = mutation(patch);
export const useDeleteContractor = mutation(remove);
