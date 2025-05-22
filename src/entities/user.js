// src/entities/user.js
// -----------------------------------------------------------------------------
// Управление пользователями (profiles) — теперь без фильтрации по project_id
// -----------------------------------------------------------------------------
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';

const FIELDS = 'id, name, email, role, project_id';

/* ─────────── SELECT ─────────── */
/** Получить всех пользователей БД без фильтрации */
export const useUsers = () => {
    return useQuery({
        queryKey: ['users', 'all'],
        queryFn : async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select(FIELDS)
                .order('id');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });
};

/* ─────────── UPDATE (role) ─────────── */
export const useUpdateUserRole = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, newRole }) => {
            const { data, error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', id)
                .select(FIELDS)
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries(['users', 'all']),
    });
};

/* ─────────── DELETE ─────────── */
export const useDeleteUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries(['users', 'all']),
    });
};
