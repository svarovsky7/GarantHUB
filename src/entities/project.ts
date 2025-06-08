// src/entities/project.ts
// -----------------------------------------------------------------------------
// CRUD-хуки для проектов
// -----------------------------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import type { Project } from '@/shared/types/project';

/* ---------- helpers ---------- */
const normalize = (s: string) => s.trim();
const sanitize = (obj: Partial<Project>) => ({ name: normalize(obj.name ?? '') });

/* ===================== READ ===================== */
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

/* === generic invalidate helper === */
const withInvalidate =
    <TArgs extends any[], TResult>(fn: (...args: TArgs) => Promise<TResult>) =>
        () => {
            const qc = useQueryClient();
            return useMutation({
                mutationFn: fn,
                onSuccess : () => qc.invalidateQueries({ queryKey: ['projects'] }),
            });
        };

/* ==================== CREATE ==================== */
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
const deleteProject = async (id: number): Promise<void> => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
};
export const useDeleteProject = withInvalidate(deleteProject);

