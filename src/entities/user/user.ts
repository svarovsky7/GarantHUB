// src/entities/user.js
// -----------------------------------------------------------------------------
// Управление пользователями (profiles) — теперь без фильтрации по project_id
// -----------------------------------------------------------------------------
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { User } from '@/shared/types/user';
import type { RoleName } from '@/shared/types/rolePermission';

const FIELDS =
  'id, name, email, role, created_at, is_active, profiles_projects ( project_id )';

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
            const users = (data ?? []).map((u: any) => ({
                ...u,
                project_ids: u.profiles_projects?.map((p: any) => p.project_id) ?? [],
            }));
            users.sort((a: any, b: any) => {
                const an = a.name ?? a.email ?? '';
                const bn = b.name ?? b.email ?? '';
                return an.localeCompare(bn);
            });
            return users;
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
            return {
                ...data,
                project_ids: data?.profiles_projects?.map((p: any) => p.project_id) ?? [],
            } as User;
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
 * @param payload Данные нового профиля и список проектов
 */
export async function addUserProfile(payload: {
    id: string;
    name: string | null;
    email: string;
    role: RoleName;
    project_ids: number[];
}): Promise<void> {
    const { project_ids, ...profile } = payload;
    const { error } = await supabase.from('profiles').insert({
        ...profile,
        is_active: true
    });
    if (error) throw error;
    if (project_ids.length) {
        const rows = project_ids.map((pid) => ({ profile_id: payload.id, project_id: pid }));
        const { error: linkErr } = await supabase
            .from('profiles_projects')
            .insert(rows);
        if (linkErr) throw linkErr;
    }
}

/* ─────────── UPDATE PROJECTS ─────────── */
/**
 * Обновляет список проектов пользователя.
 * Перезаписывает связи в таблице `profiles_projects`.
 */
export const useUpdateUserProjects = () => {
    const qc = useQueryClient();
    return useMutation<void, Error, { id: string; projectIds: number[] }>({
        mutationFn: async ({ id, projectIds }): Promise<void> => {
            const { data: current, error: selErr } = await supabase
                .from('profiles_projects')
                .select('project_id')
                .eq('profile_id', id);
            if (selErr) throw selErr;
            const currentIds = (current ?? []).map((p: any) => p.project_id);
            const toInsert = projectIds
                .filter((pid) => !currentIds.includes(pid))
                .map((pid) => ({ profile_id: id, project_id: pid }));
            const toDelete = currentIds.filter((pid) => !projectIds.includes(pid));
            if (toInsert.length) {
                const { error } = await supabase
                    .from('profiles_projects')
                    .insert(toInsert);
                if (error) throw error;
            }
            if (toDelete.length) {
                const { error } = await supabase
                    .from('profiles_projects')
                    .delete()
                    .eq('profile_id', id)
                    .in('project_id', toDelete);
                if (error) throw error;
            }
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'all'] }),
    });
};


/** Обновить имя пользователя. */
export const useUpdateUserName = () => {
    const qc = useQueryClient();
    return useMutation<User, Error, { id: string; name: string | null }>({
        mutationFn: async ({ id, name }) => {
            const { data, error } = await supabase
                .from('profiles')
                .update({ name })
                .eq('id', id)
                .select(FIELDS)
                .single();
            if (error) throw error;
            return {
                ...data,
                project_ids: data?.profiles_projects?.map((p: any) => p.project_id) ?? [],
            } as User;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'all'] }),
    });
};

/** Сменить пароль текущего пользователя. */
export const useChangePassword = () =>
    useMutation<void, Error, string>({
        mutationFn: async (password: string) => {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
        },
    });

/* ─────────── UPDATE USER STATUS ─────────── */
/** Переключить активность пользователя. */
export const useUpdateUserStatus = () => {
    const qc = useQueryClient();
    return useMutation<User, Error, { id: string; isActive: boolean }>({
        mutationFn: async ({ id, isActive }): Promise<User> => {
            const { data, error } = await supabase
                .from('profiles')
                .update({ is_active: isActive })
                .eq('id', id)
                .select(FIELDS)
                .single();
            if (error) throw error;
            return {
                ...data,
                project_ids: data?.profiles_projects?.map((p: any) => p.project_id) ?? [],
            } as User;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'all'] }),
    });
};
