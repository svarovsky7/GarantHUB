/**
 * CRUD-хуки для таблицы contractors.
 * Запрещены дубликаты по паре (inn, lower(name)).
 */
import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

/* ────────────── SELECT ────────────── */
const FIELDS = `
  id,
  name,
  inn,
  phone,
  email,
  comment:description,
  created_at
`;

/* '' → null, comment → description, trim name */
const sanitize = (o) =>
    Object.fromEntries(
        Object.entries(o)
            .filter(([k]) =>
                ['name', 'inn', 'phone', 'email', 'comment'].includes(k),
            )
            .map(([k, v]) => [
                k === 'comment' ? 'description' : k,
                k === 'name' ? v.trim() : v === '' ? null : v,
            ]),
    );

/* ────────────── DUPLICATE CHECK ────────────── */
/**
 * true  → дубль найден
 * false → можно вставлять/обновлять
 */
const isDuplicate = async ({ name, inn }, excludeId = null) => {
    const n = name.trim();
    const { data } = await supabase
        .from('contractors')
        .select('id', { head: true })               // COUNT(*) не нужен
        .or(`and(inn.eq.${inn},name.ilike.${n})`)   // CHANGE
        .neq('id', excludeId);

    return !!data;                                // true ⇢ есть записи
};

/* ────────────── CREATE ────────────── */
const insert = async (payload) => {
    if (await isDuplicate(payload))
        throw new Error('Компания с таким названием и ИНН уже существует');

    const { data, error } = await supabase
        .from('contractors')
        .insert(sanitize(payload))
        .select(FIELDS)
        .single();

    if (error) throw error;
    return data;
};

/* ────────────── UPDATE ────────────── */
const patch = async ({ id, updates }) => {
    // берём итоговые значения (старые + новые) для проверки дубликата
    const { data: current } = await supabase
        .from('contractors')
        .select('name,inn')
        .eq('id', id)
        .single();

    const pair = {
        name: updates.name ?? current.name,
        inn : updates.inn  ?? current.inn,
    };

    if (await isDuplicate(pair, id))
        throw new Error('Компания с таким названием и ИНН уже существует');

    const { data, error } = await supabase
        .from('contractors')
        .update(sanitize(updates))
        .eq('id', id)
        .select(FIELDS)
        .single();

    if (error) throw error;
    return data;
};

/* ────────────── DELETE ────────────── */
const remove = async (id) => {
    const { error } = await supabase.from('contractors').delete().eq('id', id);
    if (error) throw error;
};

/* ────────────── React-Query хуки ────────────── */
export const useContractors = () =>
    useQuery({
        queryKey: ['contractors'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('contractors')
                .select(FIELDS)
                .order('name');
            if (error) throw error;
            return data ?? [];
        },
    });

const invalidate =
    (fn) =>
        () => {
            const qc = useQueryClient();
            return useMutation({
                mutationFn: fn,
                onSuccess: () => qc.invalidateQueries(['contractors']),
            });
        };

export const useAddContractor    = invalidate(insert);
export const useUpdateContractor = invalidate(patch);
export const useDeleteContractor = invalidate(remove);

/* ───────────  (SQL — добавьте один раз) ───────────
ALTER TABLE contractors
  ADD CONSTRAINT contractors_name_inn_unique
  UNIQUE (inn, lower(name));                        -- CHANGE
--------------------------------------------------- */
