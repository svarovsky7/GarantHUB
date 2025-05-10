/* eslint-disable import/prefer-default-export */
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';

/* ───────── helpers ───────── */
const normalize = (s) => s.trim();                 // CHANGE: единая нормализация
const sanitize  = (obj) => ({ name: normalize(obj.name ?? '') });

/* ───────── API ───────── */
const getProjects = async () => {
    const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('id');
    if (error) throw error;
    return data ?? [];
};

/* ---------- CREATE ---------- */
const createProject = async (payload) => {
    const { name } = sanitize(payload);
    if (!name) throw new Error('Название проекта обязательно');

    /* CHANGE: проверка дубликата (exact match, case‑sensitive) */
    const { data: dup } = await supabase
        .from('projects')
        .select('id')
        .eq('name', name)
        .limit(1)
        .maybeSingle();
    if (dup) throw new Error('Проект с таким названием уже существует');

    const { data, error } = await supabase
        .from('projects')
        .insert({ name })
        .select('id, name')
        .single();
    if (error) throw error;
    return data;
};

/* ---------- UPDATE ---------- */
const updateProject = async ({ id, updates }) => {
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
    return data;
};

/* ---------- DELETE ---------- */
const deleteProject = async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
};

/* ───────── hooks ───────── */
export const useProjects = () =>
    useQuery({ queryKey: ['projects'], queryFn: getProjects });

export const useAddProject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createProject,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });
};

export const useUpdateProject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateProject,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });
};

export const useDeleteProject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteProject,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });
};