// src/entities/unit.js
import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import { useProjectId } from '@/shared/hooks/useProjectId';

/* ---------- базовый SELECT ---------- */
const SELECT = `
  id, name, building, section, floor,
  project_id,
  project:projects ( id, name ),
  unit_persons (
    person:persons ( id, full_name, phone, email )
  )
`;

const sanitize = (obj) => {
    const allowed = ['name', 'building', 'section', 'floor', 'project_id'];
    return Object.fromEntries(
        Object.entries(obj)
            .filter(([k]) => allowed.includes(k))
            .map(([k, v]) => [k, v === '' ? null : v]),
    );
};

/* ====================== READ ====================== */
export const useUnits = () => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: ['units', projectId],
        enabled : !!projectId,
        queryFn : async () => {
            const { data, error } = await supabase
                .from('units')
                .select(SELECT)
                .eq('project_id', projectId)
                .order('id');

            if (error) throw error;

            return (data ?? []).map((u) => ({
                ...u,
                persons: (u.unit_persons?.map((l) => l.person).filter(Boolean)) ?? [],
            }));
        },
    });
};

export const useUnitsByProject = (projectId) =>
    useQuery({
        queryKey: ['units', projectId ?? 'all'],
        enabled : !!projectId,
        queryFn : async () => {
            const { data, error } = await supabase
                .from('units')
                .select(SELECT)
                .eq('project_id', projectId)
                .order('id');

            if (error) throw error;

            return (data ?? []).map((u) => ({
                ...u,
                persons: (u.unit_persons?.map((l) => l.person).filter(Boolean)) ?? [],
            }));
        },
    });

export const useUnit = (unitId) => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: ['unit', unitId, projectId],
        enabled : !!unitId && !!projectId,
        queryFn : async () => {
            const { data, error } = await supabase
                .from('units')
                .select(SELECT)
                .eq('id', unitId)
                .eq('project_id', projectId)
                .single();

            if (error) throw error;

            return {
                ...data,
                persons: (data.unit_persons?.map((l) => l.person).filter(Boolean)) ?? [],
            };
        },
    });
};

/* ====================== CREATE ====================== */
const createUnit = async (payload) => {
    // защита от дублей (квартира + проект уникальны)
    const { data: dup } = await supabase
        .from('units')
        .select('id')
        .eq('project_id', payload.project_id)
        .eq('name', payload.name)
        .limit(1)
        .maybeSingle();

    if (dup)
        throw new Error('Объект с такой квартирой в данном проекте уже существует');

    const { data, error } = await supabase
        .from('units')
        .insert(sanitize(payload))
        .select(SELECT)
        .single();

    if (error) throw error;

    return { ...data, persons: [] };
};

export const useAddUnit = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => createUnit(payload), // Теперь корректно из формы
        onSuccess : () => qc.invalidateQueries({ queryKey: ['units'] }),
    });
};

/* ====================== UPDATE ====================== */
const updateUnit = async ({ id, updates }) => {
    // Проверка дубликата при смене номера
    if (updates.name && updates.project_id) {
        const { data: dup } = await supabase
            .from('units')
            .select('id')
            .eq('project_id', updates.project_id)
            .eq('name', updates.name)
            .neq('id', id)
            .limit(1)
            .maybeSingle();

        if (dup) throw new Error('Другой объект с такой квартирой уже есть');
    }

    const { data, error } = await supabase
        .from('units')
        .update(sanitize(updates))
        .eq('id', id)
        .eq('project_id', updates.project_id)
        .select(SELECT)
        .single();

    if (error) throw error;

    return {
        ...data,
        persons: (data.unit_persons?.map((l) => l.person).filter(Boolean)) ?? [],
    };
};

export const useUpdateUnit = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (args) => updateUnit(args),
        onSuccess : () => qc.invalidateQueries({ queryKey: ['units'] }),
    });
};

/* ====================== DELETE ====================== */
export const useDeleteUnit = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('units')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['units'] }),
    });
};
