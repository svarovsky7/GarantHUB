import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import type { Person } from '@/shared/types/person';

const FIELDS = `
  id, full_name, phone, email,
  passport_series, passport_number,
  description
`;

const sanitize = (obj: Record<string, any>): Record<string, any> =>
    Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
            k,
            typeof v === 'string' ? v.trim() || null : v,
        ]),
    );

/**
 * Проверяем, существует ли физлицо с такими паспортными данными.
 * Возвращает найденную запись или `null`.
 */
const findDuplicate = async (
    { passport_series, passport_number }: { passport_series?: string | null; passport_number?: string | null },
    excludeId: number | null = null,
): Promise<{ id: number; full_name: string } | null> => {
    if (!passport_series || !passport_number) return null;

    let q = supabase
        .from('persons')
        .select('id, full_name')
        .eq('passport_series', passport_series)
        .eq('passport_number', passport_number)
        .limit(1);

    if (excludeId != null) q = q.neq('id', excludeId);
    
    const { data, error } = await q.maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
};

/** Список людей текущего проекта — ФИЛЬТРАЦИЯ ПО PROJECT_ID */
export const usePersons = () => {
    return useQuery<Person[]>({
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
const insert = async (payload: Partial<Person>): Promise<Person> => {
    const row = sanitize(payload);
    const dup = await findDuplicate(row);
    if (dup)
        throw new Error(`Такой человек уже есть в БД: ${dup.full_name}`);
    const { data, error } = await supabase
        .from('persons')
        .insert(row)
        .select(FIELDS)
        .single();
    if (error) throw error;
    return data;
};

const updateRow = async ({ id, updates }: { id: number; updates: Partial<Person> }): Promise<Person> => {
    const { data: current, error: err } = await supabase
        .from('persons')
        .select('passport_series, passport_number, phone')
        .eq('id', id)
        .single();
    if (err) throw err;

    const dupCheck = {
        passport_series: updates.passport_series ?? current.passport_series,
        passport_number: updates.passport_number ?? current.passport_number,
    };

    const dup = await findDuplicate(dupCheck, id);
    if (dup)
        throw new Error(`Такой человек уже есть в БД: ${dup.full_name}`);

    const { data, error } = await supabase
        .from('persons')
        .update(sanitize(updates))
        .eq('id', id)
        .select(FIELDS)
        .single();

    if (error) throw error;
    return data;
};

const remove = async (id: number): Promise<void> => {
    const { error } = await supabase.from('persons').delete().eq('id', id);
    if (error) throw error;
};

const useInvalidatePersons = () => {
    const qc = useQueryClient();
    return () => qc.invalidateQueries({ queryKey: ['persons'] });
};

export const useAddPerson = () => {
    const invalidatePersons = useInvalidatePersons();
    return useMutation<Person, Error, Partial<Person>>({
        mutationFn : (values) => insert(values),
        onSuccess  : invalidatePersons,
    });
};

export const useUpdatePerson = () => {
    const invalidatePersons = useInvalidatePersons();
    return useMutation<Person, Error, { id: number; updates: Partial<Person> }>({
        mutationFn : updateRow,
        onSuccess  : invalidatePersons,
    });
};

export const useDeletePerson = () => {
    const invalidatePersons = useInvalidatePersons();
    return useMutation<void, Error, number>({
        mutationFn : remove,
        onSuccess  : invalidatePersons,
    });
};