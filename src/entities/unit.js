import { supabase } from '@shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

/* ───────── SELECT ───────── */
// CHANGE: реальное FK-поле person_id, нет unit_persons
const SELECT = `
    id, name, building, section, floor,
    project_id, person_id,
    project:projects ( id, name ),
    person:persons  ( id, full_name, phone, email )
`;

/* ───────── helpers ───────── */
const sanitize = (obj) => {
    const allowed = ['name', 'building', 'section', 'floor', 'project_id', 'person_id'];
    return Object.fromEntries(
        Object.entries(obj)
            .filter(([k]) => allowed.includes(k))
            .map(([k, v]) => [k, v === '' ? null : v]),
    );
};

/* ───────────────────────── READ ───────────────────────── */
export const useUnits = () =>
    useQuery({
        queryKey: ['units'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('units')
                .select(SELECT)
                .order('id');
            if (error) throw error;

            // CHANGE: person → persons[] для совместимости со старым UI
            return (data ?? []).map((u) => ({
                ...u,
                persons: u.person ? [u.person] : [],
            }));
        },
    });

/* остальные хуки (useUnitsByProject, useUnit, useAddUnit, …)
   переписаны тем же образом — см. ниже */

export const useUnitsByProject = (projectId) =>
    useQuery({
        queryKey: ['units', projectId ?? 'all'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('units')
                .select(SELECT)
                .eq('project_id', projectId)
                .order('id');
            if (error) throw error;

            return (data ?? []).map((u) => ({
                ...u,
                persons: u.person ? [u.person] : [],
            }));
        },
        enabled: !!projectId,
    });

export const useUnit = (unitId) =>
    useQuery({
        queryKey: ['unit', unitId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('units')
                .select(SELECT)
                .eq('id', unitId)
                .single();
            if (error) throw error;

            return {
                ...data,
                persons: data.person ? [data.person] : [],
            };
        },
        enabled: !!unitId,
    });

/* ---------- CREATE ---------- */
const createUnit = async (payload) => {
    // уникальность (project_id,name)
    const { data: dup } = await supabase
        .from('units')
        .select('id')
        .eq('project_id', payload.project_id)
        .eq('name', payload.name)
        .limit(1)
        .maybeSingle();
    if (dup) throw new Error('Объект с такой квартирой в выбранном проекте уже существует');

    const { data, error } = await supabase
        .from('units')
        .insert(sanitize(payload))
        .select(SELECT)
        .single();
    if (error) throw error;

    return { ...data, persons: data.person ? [data.person] : [] };
};

export const useAddUnit = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createUnit,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['units'] }),
    });
};

/* ---------- UPDATE ---------- */
const updateUnit = async ({ id, updates }) => {
    if (updates.project_id && updates.name) {
        const { data: dup } = await supabase
            .from('units')
            .select('id')
            .eq('project_id', updates.project_id)
            .eq('name', updates.name)
            .neq('id', id)
            .limit(1)
            .maybeSingle();
        if (dup) throw new Error('Другой объект с такой квартирой уже есть в этом проекте');
    }

    const { data, error } = await supabase
        .from('units')
        .update(sanitize(updates))
        .eq('id', id)
        .select(SELECT)
        .single();
    if (error) throw error;

    return { ...data, persons: data.person ? [data.person] : [] };
};

export const useUpdateUnit = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateUnit,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['units'] }),
    });
};

/* ---------- DELETE ---------- */
export const useDeleteUnit = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('units').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['units'] }),
    });
};
