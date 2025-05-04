/* entities/person.js
 * CRUD-хуки для таблицы persons.
 */
import { supabase } from '@shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/* поля, которые всегда выбираем */
const FIELDS =
    'id, project_id, full_name, phone, email, project:projects ( id, name )';

/* '' → null, trim full_name */
const sanitize = (o) =>
    Object.fromEntries(
        Object.entries(o)
            .filter(([k]) =>
                ['project_id', 'full_name', 'phone', 'email'].includes(k),
            )
            .map(([k, v]) => [
                k,
                k === 'full_name' ? v.trim() : v === '' ? null : v,
            ]),
    );

/* ───────────────────── duplicate helper ───────────────────── */
const isDuplicate = async ({ project_id, full_name }, excludeId = null) => {
    const { data } = await supabase
        .from('persons')
        .select('id', { head: true })                     // быстрый EXISTS
        .eq('project_id', project_id)
        .filter('lower(full_name)', 'eq', full_name.trim().toLowerCase())
        .neq('id', excludeId);

    return !!data;                                     // true ⇢ дубль есть
};

/* ───────────────────────── READ ───────────────────────── */
export const usePersons = () =>
    useQuery({
        queryKey: ['persons'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('persons')
                .select(FIELDS)
                .order('id');
            if (error) throw error;
            return data ?? [];
        },
    });

/* ──────────────────────── CREATE ──────────────────────── */
const insert = async (payload) => {
    if (await isDuplicate(payload))
        throw new Error('Такое ФИО уже существует в выбранном проекте');

    const { data, error } = await supabase
        .from('persons')
        .insert(sanitize(payload))
        .select(FIELDS)
        .single();

    if (error) {
        if (error.message.includes('duplicate key'))
            throw new Error('Такое ФИО уже существует в выбранном проекте');
        throw error;
    }
    return data;
};

/* ──────────────────────── UPDATE ──────────────────────── */
const updateRow = async ({ id, updates }) => {
    /* берём актуальные значения для проверки */
    const { data: current } = await supabase
        .from('persons')
        .select('project_id, full_name')
        .eq('id', id)
        .single();

    const pair = {
        project_id: updates.project_id ?? current.project_id,
        full_name : (updates.full_name ?? current.full_name).trim(),
    };

    if (await isDuplicate(pair, id))
        throw new Error('Такое ФИО уже существует в выбранном проекте');

    const { data, error } = await supabase
        .from('persons')
        .update(sanitize(updates))
        .eq('id', id)
        .select(FIELDS)
        .single();

    if (error) {
        if (error.message.includes('duplicate key'))
            throw new Error('Такое ФИО уже существует в выбранном проекте');
        throw error;
    }
    return data;
};

/* ──────────────────────── DELETE ──────────────────────── */
const remove = async (id) => {
    const { error } = await supabase.from('persons').delete().eq('id', id);
    if (error) throw error;
};

/* ─────────────────── React-Query хуки ─────────────────── */
const withInvalidate =
    (fn) =>
        () => {
            const qc = useQueryClient();
            return useMutation({
                mutationFn: fn,
                onSuccess: () => qc.invalidateQueries(['persons']),
            });
        };

export const useAddPerson    = withInvalidate(insert);
export const useUpdatePerson = withInvalidate(updateRow);
export const useDeletePerson = withInvalidate(remove);

/* ──────────────── (один раз в БД) ────────────────
CREATE UNIQUE INDEX IF NOT EXISTS
  persons_project_fullname_uidx
ON persons (project_id, lower(full_name));
--------------------------------------------------- */
