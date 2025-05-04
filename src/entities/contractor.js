import { supabase } from '@shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const FIELDS = 'id,name,inn,phone,email,is_individual';

const sanitize = (o) =>
    Object.fromEntries(
        Object.entries(o)
            .filter(([k]) => ['name', 'inn', 'phone', 'email', 'is_individual'].includes(k))
            .map(([k, v]) => [k, v || null]),
    );

/* ---------- READ ---------- */
export const useContractors = ({ individual = false } = {}) =>
    useQuery({
        queryKey: ['contractors', individual],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('contractors')
                .select(FIELDS)
                .eq('is_individual', individual)
                .order('id');
            if (error) throw error;
            return data ?? [];
        },
    });

/* ---------- CREATE ---------- */
const createContractor = async (payload) => {
    const { data: dup } = await supabase
        .from('contractors')
        .select('id')
        .eq('name', payload.name)
        .eq('inn', payload.inn)
        .limit(1)
        .maybeSingle();
    if (dup) throw new Error('Контрагент с таким названием и ИНН уже существует');

    const { data, error } = await supabase
        .from('contractors')
        .insert(sanitize(payload))
        .select(FIELDS)
        .single();
    if (error) throw error;
    return data;
};

export const useAddContractor = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createContractor,
        // CHANGE: предикат — обновляем любые вариации ключа 'contractors'
        onSuccess: () =>
            qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'contractors' }),
    });
};

/* ---------- UPDATE ---------- */
const updateContractor = async ({ id, updates }) => {
    if (updates.name && updates.inn) {
        const { data: dup } = await supabase
            .from('contractors')
            .select('id')
            .eq('name', updates.name)
            .eq('inn', updates.inn)
            .neq('id', id)
            .limit(1)
            .maybeSingle();
        if (dup) throw new Error('Другой контрагент с таким названием и ИНН уже есть');
    }

    const { data, error } = await supabase
        .from('contractors')
        .update(sanitize(updates))
        .eq('id', id)
        .select(FIELDS)
        .single();
    if (error) throw error;
    return data;
};

export const useUpdateContractor = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateContractor,
        onSuccess: () =>
            qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'contractors' }),
    });
};

/* ---------- DELETE ---------- */
export const useDeleteContractor = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('contractors').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () =>
            qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'contractors' }),
    });
};
