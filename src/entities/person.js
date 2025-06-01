import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

const FIELDS = `
  id, full_name, phone, email,
  passport_series, passport_number
`;

const sanitize = (obj) =>
    Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
            k,
            typeof v === 'string' ? v.trim() || null : v,
        ]),
    );

// Проверка дубля по паспортным данным или телефону
const isDuplicate = async (
    { passport_series, passport_number, phone },
    excludeId = null,
) => {
    let q = supabase.from('persons').select('id', { head: true });
    if (passport_series && passport_number) {
        q = q
            .eq('passport_series', passport_series)
            .eq('passport_number', passport_number);
    } else if (phone) {
        q = q.eq('phone', phone);
    } else {
        return false;
    }
    if (excludeId != null) q = q.neq('id', excludeId);
    const { data, error } = await q;
    if (error && error.code !== '406') throw error;
    return !!data;
};

/** Список людей текущего проекта — ФИЛЬТРАЦИЯ ПО PROJECT_ID */
export const usePersons = () => {
    return useQuery({
        queryKey: ['persons'],
        queryFn : async () => {
            const { data, error } = await supabase
                .from('persons')
                .select(FIELDS)
                .order('id');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });
};

export const usePersonsByProject = usePersons;

// --- CRUD ---
const insert = async (payload) => {
    const row = sanitize(payload);
    if (await isDuplicate(row))
        throw new Error('Такое лицо уже существует');
    const { data, error } = await supabase
        .from('persons')
        .insert(row)
        .select(FIELDS)
        .single();
    if (error) throw error;
    return data;
};

const updateRow = async ({ id, updates }) => {
    const { data: current, error: err } = await supabase
        .from('persons')
        .select('passport_series, passport_number, phone')
        .eq('id', id)
        .single();
    if (err) throw err;

    const dupCheck = {
        passport_series: updates.passport_series ?? current.passport_series,
        passport_number: updates.passport_number ?? current.passport_number,
        phone          : updates.phone ?? current.phone,
    };

    if (await isDuplicate(dupCheck, id))
        throw new Error('Такое лицо уже существует');

    const { data, error } = await supabase
        .from('persons')
        .update(sanitize(updates))
        .eq('id', id)
        .select(FIELDS)
        .single();

    if (error) throw error;
    return data;
};

const remove = async (id) => {
    const { error } = await supabase.from('persons').delete().eq('id', id);
    if (error) throw error;
};

const useInvalidatePersons = () => {
    const qc = useQueryClient();
    return () => qc.invalidateQueries({ queryKey: ['persons'] });
};

export const useAddPerson = () => {
    const invalidatePersons = useInvalidatePersons();
    return useMutation({
        mutationFn : (values) => insert(values),
        onSuccess  : invalidatePersons,
    });
};
export const useUpdatePerson = () => {
    const invalidatePersons = useInvalidatePersons();
    return useMutation({
        mutationFn : updateRow,
        onSuccess  : invalidatePersons,
    });
};
export const useDeletePerson = () => {
    const invalidatePersons = useInvalidatePersons();
    return useMutation({
        mutationFn : remove,
        onSuccess  : invalidatePersons,
    });
};
