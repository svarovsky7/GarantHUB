// src/entities/person.js
// -----------------------------------------------------------------------------
// CRUD-API для persons с автоматической фильтрацией по текущему project_id
// -----------------------------------------------------------------------------
/* eslint-disable import/prefer-default-export */

import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

/** Поля, которые всегда запрашиваем */
const FIELDS = `
  id, project_id, full_name, phone, email,
  project:projects ( id, name )
`;

/* -------------------------------------------------------------------------- */
/*                                 helpers                                    */
/* -------------------------------------------------------------------------- */

/** trim + ''→null */
const sanitize = (obj) =>
    Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
            k,
            typeof v === 'string' ? v.trim() || null : v,
        ]),
    );

/** Проверка дубликатов ФИО внутри проекта */
const isDuplicate = async ({ project_id, full_name }, excludeId = null) => {
    const fio = (full_name ?? '').trim();

    let q = supabase
        .from('persons')
        .select('id', { head: true })
        .eq('project_id', project_id)
        .eq('full_name', fio);

    if (excludeId != null) q = q.neq('id', excludeId);

    const { data, error } = await q;
    if (error && error.code !== '406') throw error; // 406: rows not found

    return !!data;
};

/* -------------------------------------------------------------------------- */
/*                                   READ                                     */
/* -------------------------------------------------------------------------- */

/** Список людей текущего проекта */
export const usePersons = () => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: ['persons', projectId],
        enabled : !!projectId,
        queryFn : async () => {
            const { data, error } = await supabase
                .from('persons')
                .select(FIELDS)
                .eq('project_id', projectId)
                .order('id');
            if (error) throw error;
            return data ?? [];
        },
    });
};

/** 🔄 Совместимый алиас для старого кода (LitigationForm и др.) */
export const usePersonsByProject = usePersons;

/* -------------------------------------------------------------------------- */
/*                                  CREATE                                    */
/* -------------------------------------------------------------------------- */

const insert = async (payload, project_id) => {
    const row = { ...sanitize(payload), project_id };

    if (await isDuplicate(row))
        throw new Error('Такое ФИО уже существует в проекте');

    const { data, error } = await supabase
        .from('persons')
        .insert(row)
        .select(FIELDS)
        .single();

    if (error) throw error;
    return data;
};

/* -------------------------------------------------------------------------- */
/*                                  UPDATE                                    */
/* -------------------------------------------------------------------------- */

const updateRow = async ({ id, updates }) => {
    const { data: current, error: err } = await supabase
        .from('persons')
        .select('project_id, full_name')
        .eq('id', id)
        .single();
    if (err) throw err;

    const dupCheck = {
        project_id: current.project_id,
        full_name : updates.full_name ?? current.full_name,
    };

    if (await isDuplicate(dupCheck, id))
        throw new Error('Такое ФИО уже существует в проекте');

    const { data, error } = await supabase
        .from('persons')
        .update(sanitize(updates))
        .eq('id', id)
        .select(FIELDS)
        .single();

    if (error) throw error;
    return data;
};

/* -------------------------------------------------------------------------- */
/*                                  DELETE                                    */
/* -------------------------------------------------------------------------- */

const remove = async (id) => {
    const { error } = await supabase.from('persons').delete().eq('id', id);
    if (error) throw error;
};

/* -------------------------------------------------------------------------- */
/*                       React-Query wrappers (DRY)                           */
/* -------------------------------------------------------------------------- */

const useInvalidatePersons = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return () => qc.invalidateQueries({ queryKey: ['persons', projectId] });
};

/** Добавить человека */
export const useAddPerson = () => {
    const projectId         = useProjectId();
    const invalidatePersons = useInvalidatePersons();
    return useMutation({
        mutationFn : (values) => insert(values, projectId),
        onSuccess  : invalidatePersons,
    });
};

/** Обновить человека */
export const useUpdatePerson = () => {
    const invalidatePersons = useInvalidatePersons();
    return useMutation({
        mutationFn : updateRow,
        onSuccess  : invalidatePersons,
    });
};

/** Удалить человека */
export const useDeletePerson = () => {
    const invalidatePersons = useInvalidatePersons();
    return useMutation({
        mutationFn : remove,
        onSuccess  : invalidatePersons,
    });
};
