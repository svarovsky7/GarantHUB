// src/entities/unit.js
// -----------------------------------------------------------------------------
// CRUD для объектов (квартир/помещений) + связи с жильцами
// -----------------------------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

/* ---------- базовый SELECT ---------- */
const SELECT = `
  id, name, building, section, floor,
  project_id,
  project:projects ( id, name ),
  unit_persons (
    person:persons ( id, full_name, phone, email )
  )
`;

/* ---------- helper: отфильтровываем разрешённые поля ---------- */
const sanitize = (obj) => {
    const allowed = ['name', 'building', 'section', 'floor', 'project_id'];
    return Object.fromEntries(
        Object.entries(obj)
            .filter(([k]) => allowed.includes(k))
            .map(([k, v]) => [k, v === '' ? null : v]),
    );
};

/* ====================== READ ====================== */
export const useUnits = () =>
    useQuery({
        queryKey: ['units'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('units')
                .select(SELECT)
                .order('id');

            if (error) throw error;

            return (data ?? []).map((u) => ({
                ...u,
                persons: u.unit_persons?.map((l) => l.person) ?? [],
            }));
        },
    });

export const useUnitsByProject = (projectId) =>
    useQuery({
        queryKey: ['units', projectId ?? 'all'],
        enabled: !!projectId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('units')
                .select(SELECT)
                .eq('project_id', projectId)
                .order('id');

            if (error) throw error;

            return (data ?? []).map((u) => ({
                ...u,
                persons: u.unit_persons?.map((l) => l.person) ?? [],
            }));
        },
    });

export const useUnit = (unitId) =>
    useQuery({
        queryKey: ['unit', unitId],
        enabled: !!unitId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('units')
                .select(SELECT)
                .eq('id', unitId)
                .single();

            if (error) throw error;

            return {
                ...data,
                persons: data.unit_persons?.map((l) => l.person) ?? [],
            };
        },
    });

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
        throw new Error('Объект с такой квартирой в выбранном проекте уже существует');

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
        mutationFn: createUnit,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['units'] }),
    });
};

/* ====================== UPDATE ====================== */
const updateUnit = async ({ id, updates }) => {
    // проверка дубликата при смене номера или проекта
    if (updates.project_id && updates.name) {
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
        .select(SELECT)
        .single();

    if (error) throw error;

    return {
        ...data,
        persons: data.unit_persons?.map((l) => l.person) ?? [],
    };
};

export const useUpdateUnit = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateUnit,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['units'] }),
    });
};

/* ====================== DELETE ====================== */
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
