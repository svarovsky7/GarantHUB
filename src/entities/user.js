import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';   // FIX-path

/* поля, которые всегда выбираем */
const FIELDS = 'id, name, email, role';

/* ─────────── SELECT ─────────── */
export const useUsers = () =>
    useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select(FIELDS)
                .order('id');

            if (error) throw error;
            return data ?? [];
        },
    });

/* ─────────── UPDATE (role) ─────────── */
export const useUpdateUserRole = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, role }) => {
            const { data, error } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', id)
                .select(FIELDS)
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries(['users']),
    });
};

/* ─────────── DELETE ─────────── */
export const useDeleteUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries(['users']),
    });
};
