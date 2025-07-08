// src/entities/project.ts
// -----------------------------------------------------------------------------
// CRUD-хуки для проектов
// -----------------------------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import React from 'react';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import type { Project } from '@/shared/types/project';
import { useAuthStore } from '@/shared/store/authStore';
import { useRolePermission } from '@/entities/rolePermission';
import type { RoleName } from '@/shared/types/rolePermission';

/* ---------- helpers ---------- */
const normalize = (s: string) => s.trim();
const sanitize = (obj: Partial<Project>) => ({ name: normalize(obj.name ?? '') });

/**
 * Загружает список проектов из Supabase.
 * Возвращает React Query хук с кэшированными данными.
 */
export const useProjects = () =>
    useQuery({
        queryKey: ['projects'],
        queryFn : async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name')
                .order('id');
            if (error) throw error;
            return (data ?? []) as Project[];
        },
        staleTime: 5 * 60_000,
    });

/**
 * Фабрика мутаций с автоматическим инвалидированием
 * кэша проектов после выполнения.
 */
const withInvalidate =
    <TVariables, TResult>(fn: (vars: TVariables) => Promise<TResult>) =>
        () => {
            const qc = useQueryClient();
            return useMutation<TResult, Error, TVariables>({
                mutationFn: fn,
                onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
            });
        };

/* ==================== CREATE ==================== */
/**
 * Создаёт новый проект с указанным названием.
 * @param name Название проекта
 */
const createProject = async ({ name }: { name: string }): Promise<Project> => {
    const n = normalize(name);
    if (!n) throw new Error('Название проекта обязательно');

    const { data: dup } = await supabase
        .from('projects')
        .select('id')
        .eq('name', n)
        .limit(1)
        .maybeSingle();
    if (dup) throw new Error('Проект с таким названием уже существует');

    const { data, error } = await supabase
        .from('projects')
        .insert({ name: n })
        .select('id, name')
        .single();
    if (error) throw error;
    return data as Project;
};
export const useAddProject = withInvalidate(createProject);

/* ==================== UPDATE ==================== */
/**
 * Обновляет данные проекта.
 * @param id       Идентификатор проекта
 * @param updates  Поля для обновления
 */
const updateProject = async ({ id, updates }: { id: number; updates: Partial<Project> }): Promise<Project> => {
    const fields = sanitize(updates);
    if (fields.name) {
        const { data: dup } = await supabase
            .from('projects')
            .select('id')
            .eq('name', fields.name)
            .neq('id', id)
            .limit(1)
            .maybeSingle();
        if (dup) throw new Error('Другой проект с таким названием уже есть');
    }

    const { data, error } = await supabase
        .from('projects')
        .update(fields)
        .eq('id', id)
        .select('id, name')
        .single();
    if (error) throw error;
    return data as Project;
};
export const useUpdateProject = withInvalidate(updateProject);

/* ==================== DELETE ==================== */
/**
 * Удаляет проект по его идентификатору.
 * @param id ID проекта
 */
const deleteProject = async (id: number): Promise<void> => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
};
export const useDeleteProject = withInvalidate(deleteProject);

/**
 * Возвращает список проектов с учётом настроек роли пользователя.
 * Если роли включено ограничение {@link RolePermission.only_assigned_project},
 * оставляет только проект, назначенный профилю.
 */
export const useVisibleProjects = () => {
    const query = useProjects();
    const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
    const { data: perm } = useRolePermission(role);
    const projectIds = useAuthStore((s) => s.profile?.project_ids) ?? [];

    const data = React.useMemo(() => {
        if (perm?.only_assigned_project && projectIds.length > 0) {
            return (query.data ?? []).filter((p) => projectIds.includes(p.id));
        }
        return query.data ?? [];
    }, [query.data, perm?.only_assigned_project, projectIds]);

    return React.useMemo(
        () => ({ ...query, data }) as typeof query,
        [query.data, query.error, query.isPending, data],
    );
};

