import {
    useQuery, useMutation, useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@shared/api/supabaseClient';

/* ─────────── SELECT ─────────── */
export const useUsers = () =>
    useQuery({
        queryKey: ['users'],
        queryFn : async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, role')
                .order('id');
            if (error) throw error;
            return data ?? [];
        },
    });

/* ─────────── UPDATE role ─────────── */
export const useUpdateUserRole = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, role }) => {
            const { data, error } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', id)
                .select('id, email, role')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    });
};

/* ─────────── DELETE user (NEW) ─────────── */
export const useDeleteUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    });
};
