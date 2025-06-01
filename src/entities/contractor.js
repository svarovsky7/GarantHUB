// --------------------------------------------------------
// Контрагенты — ГЛОБАЛЬНЫЕ (без project_id)
// --------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

const TABLE  = 'contractors';
const FIELDS = `
  id, name, inn, phone, email, comment:description, created_at
`;

/** trim + ''→null; comment→description */
const sanitize = (o) =>
    Object.fromEntries(
        Object.entries(o)
            .filter(([k]) =>
                ['name', 'inn', 'phone', 'email', 'comment'].includes(k),
            )
            .map(([k, v]) => [
                k === 'comment' ? 'description' : k,
                typeof v === 'string' ? v.trim() || null : v,
            ]),
    );

/**
 * Проверяем дубль по ИНН. Возвращает найденную компанию либо `null`.
 */
const findDuplicate = async ({ inn }, excludeId = null) => {
    if (!inn) return null;

    let query = supabase
        .from(TABLE)
        .select('id, name')
        .eq('inn', inn)
        .limit(1)
        .maybeSingle();

    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query;
    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
};

/* ---------------- CRUD ---------------- */
const insert = async (payload) => {
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

const patch = async ({ id, updates }) => {
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

const remove = async (id) => {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
};

/* ---------------- hooks ---------------- */
export const useContractors = () => {
    return useQuery({
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

const mutation = (fn) => () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn : fn,
        onSuccess  : () => qc.invalidateQueries({ queryKey: [TABLE] }),
    });
};

export const useAddContractor    = mutation(insert);
export const useUpdateContractor = mutation(patch);
export const useDeleteContractor = mutation(remove);
