// src/entities/user.js
// -----------------------------------------------------------------------------
// Управление пользователями (profiles) — теперь без фильтрации по project_id
// -----------------------------------------------------------------------------
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { User } from '@/shared/types/user';
import type { RoleName } from '@/shared/types/rolePermission';

const FIELDS = 'id, name, email, role, project_id';

/* ─────────── SELECT ─────────── */
/** Получить всех пользователей БД без фильтрации */
export const useUsers = () => {
    return useQuery<User[]>({
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
    return useMutation<User, Error, { id: string; newRole: string }>({
        mutationFn: async ({ id, newRole }): Promise<User> => {
            const { data, error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', id)
                .select(FIELDS)
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'all'] }),
    });
};

/* ─────────── DELETE ─────────── */
export const useDeleteUser = () => {
    const qc = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: async (id: string): Promise<void> => {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'all'] }),
    });
};

/* ─────────── CREATE ─────────── */
/**
 * Создает запись профиля пользователя в таблице `profiles`.
 * Используется после регистрации нового аккаунта.
 */
export async function addUserProfile(payload: {
    id: string;
    name: string | null;
    email: string;
    role: RoleName;
    project_id: number;
}): Promise<void> {
    const { error } = await supabase.from('profiles').insert(payload);
    if (error) throw error;
}

