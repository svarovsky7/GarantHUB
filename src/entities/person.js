import { supabase } from '@shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const FIELDS = 'id, full_name, phone, email';
const sanitize = (o) =>
    Object.fromEntries(
        Object.entries(o)
            .filter(([k]) => ['full_name', 'phone', 'email'].includes(k))
            .map(([k, v]) => [k, v || null]),
    );

/* ---------- READ ---------- */
export const usePersons = () =>
    useQuery({
        queryKey: ['persons'],
        queryFn: async () => {
            const { data, error } = await supabase.from('persons').select(FIELDS).order('id');
            if (error) throw error;
            return data ?? [];
        },
    });

/* ---------- CREATE / UPDATE / DELETE (без unique-check) ---------- */
const crud =
    (method) =>
        ({ id, payload }) =>
            supabase
                .from('persons')[method](sanitize(payload))
                .eq('id', id)
                .select(FIELDS)
                .single();

const insert = async (p) =>
    (await supabase.from('persons').insert(sanitize(p)).select(FIELDS).single()).data;

export const useAddPerson = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: insert,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['persons'] }),
    });
};
export const useUpdatePerson = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }) => crud('update')({ id, payload: updates }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['persons'] }),
    });
};
export const useDeletePerson = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('persons').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['persons'] }),
    });
};
