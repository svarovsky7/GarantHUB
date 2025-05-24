import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

const FIELDS = `
  id, project_id, full_name, phone, email,
  project:projects ( id, name )
`;

const sanitize = (obj) =>
    Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
            k,
            typeof v === 'string' ? v.trim() || null : v,
        ]),
    );

// Проверка дубля в рамках проекта — для создания/редактирования оставляем
const isDuplicate = async ({ project_id, full_name }, excludeId = null) => {
    const fio = (full_name ?? '').trim();
    let q = supabase
        .from('persons')
        .select('id', { head: true })
        .eq('project_id', project_id)
        .eq('full_name', fio);
    if (excludeId != null) q = q.neq('id', excludeId);
    const { data, error } = await q;
    if (error && error.code !== '406') throw error;
    return !!data;
};

/** Список людей текущего проекта — ФИЛЬТРАЦИЯ ПО PROJECT_ID */
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
        staleTime: 5 * 60_000,
    });
};

export const usePersonsByProject = usePersons;

// --- CRUD не меняется ---
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

const remove = async (id) => {
    const { error } = await supabase.from('persons').delete().eq('id', id);
    if (error) throw error;
};

const useInvalidatePersons = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return () => qc.invalidateQueries({ queryKey: ['persons', projectId] });
};

export const useAddPerson = () => {
    const projectId         = useProjectId();
    const invalidatePersons = useInvalidatePersons();
    return useMutation({
        mutationFn : (values) => insert(values, projectId),
        onSuccess  : invalidatePersons,
    });
};
export const useUpdatePerson = () => {
    const invalidatePersons = useInvalidatePersons();
    return useMutation({
        mutationFn : updateRow,
        onSuccess  : invalidatePersons,
    });
};
export const useDeletePerson = () => {
    const invalidatePersons = useInvalidatePersons();
    return useMutation({
        mutationFn : remove,
        onSuccess  : invalidatePersons,
    });
};
