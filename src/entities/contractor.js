// src/entities/contractor.js
// --------------------------------------------------------
// Контрагенты, изолированные по project_id
// --------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

const TABLE  = 'contractors';
const FIELDS = `
  id, project_id, name, inn, phone, email,
  comment:description, created_at
`;

/** trim + ''→null; comment→description */
const sanitize = (o) =>
    Object.fromEntries(
        Object.entries(o)
            .filter(([k]) =>
                ['project_id', 'name', 'inn', 'phone', 'email', 'comment'].includes(k),
            )
            .map(([k, v]) => [
                k === 'comment' ? 'description' : k,
                typeof v === 'string' ? v.trim() || null : v,
            ]),
    );

/** Проверяем дубль внутри проекта (inn+name) */
const isDuplicate = async ({ project_id, inn, name }, excludeId = null) => {
    const { data, error } = await supabase
        .from(TABLE)
        .select('id', { head: true })
        .eq('project_id', project_id)
        .eq('inn', inn)
        .ilike('name', name.trim())
        .neq('id', excludeId);

    if (error && error.code !== '406') throw error;
    return !!data;
};

/* ---------------- CRUD ---------------- */
const insert = async (payload) => {
    if (await isDuplicate(payload)) {
        throw new Error('Компания с таким названием и ИНН уже существует в проекте');
    }
    const { data, error } = await supabase
        .from(TABLE)
        .insert(sanitize(payload))
        .select(FIELDS)
        .single();
    if (error) throw error;
    return data;
};

const patch = async ({ id, updates }) => {
    const { data: current } = await supabase
        .from(TABLE)
        .select('project_id, inn, name')
        .eq('id', id)
        .single();

    if (
        await isDuplicate(
            {
                project_id: updates.project_id ?? current.project_id,
                inn:        updates.inn        ?? current.inn,
                name:       updates.name       ?? current.name,
            },
            id,
        )
    ) {
        throw new Error('Компания с таким названием и ИНН уже существует в проекте');
    }

    const { data, error } = await supabase
        .from(TABLE)
        .update(sanitize(updates))
        .eq('id', id)
        .select(FIELDS)
        .single();
    if (error) throw error;
    return data;
};

const remove = async (id) => {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
};

/* ---------------- hooks ---------------- */
export const useContractors = () => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: [TABLE, projectId],
        enabled : !!projectId,
        queryFn : async () => {
            const { data, error } = await supabase
                .from(TABLE)
                .select(FIELDS)
                .eq('project_id', projectId)
                .order('name');
            if (error) throw error;
            return data ?? [];
        },
    });
};

const mutation = (fn) => () => {
    const qc        = useQueryClient();
    const projectId = useProjectId();
    return useMutation({
        mutationFn : fn,
        onSuccess  : () => qc.invalidateQueries({ queryKey: [TABLE, projectId] }),
    });
};

export const useAddContractor    = mutation(insert);
export const useUpdateContractor = mutation(patch);
export const useDeleteContractor = mutation(remove);
