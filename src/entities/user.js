// src/entities/user.js
// -----------------------------------------------------------------------------
// Управление пользователями (profiles) — фильтрация по project_id текущего пользователя
// -----------------------------------------------------------------------------
// базовый файл: :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';

/* поля, которые всегда выбираем */
const FIELDS = 'id, name, email, role, project_id';

/* ─────────── SELECT ─────────── */
export const useUsers = () => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: ['users', projectId],
        enabled : !!projectId,
        queryFn : async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select(FIELDS)
                .eq('project_id', projectId)
                .order('id');

            if (error) throw error;
            return data ?? [];
        },
    });
};

/* ─────────── UPDATE (role) ─────────── */
export const useUpdateUserRole = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, role }) => {
            const { data, error } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', id)
                .eq('project_id', projectId)
                .select(FIELDS)
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries(['users', projectId]),
    });
};

/* ─────────── DELETE ─────────── */
export const useDeleteUser = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id)
                .eq('project_id', projectId);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries(['users', projectId]),
    });
};
