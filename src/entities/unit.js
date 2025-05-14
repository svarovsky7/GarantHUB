// src/entities/unit.js
// -----------------------------------------------------------------------------
// CRUD для объектов (квартир/помещений) + связи с жильцами
// ВСЕ запросы фильтруются по project_id текущего пользователя
// -----------------------------------------------------------------------------
// базовый файл: :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
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
    const allowed = ['name', 'building', 'section', 'floor'];
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
                persons: u.unit_persons?.map((l) => l.person) ?? [],
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
                persons: u.unit_persons?.map((l) => l.person) ?? [],
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
                persons: data.unit_persons?.map((l) => l.person) ?? [],
            };
        },
    });
};

/* ====================== CREATE ====================== */
const createUnit = async (payload, project_id) => {
    // защита от дублей (квартира + проект уникальны)
    const { data: dup } = await supabase
        .from('units')
        .select('id')
        .eq('project_id', project_id)
        .eq('name', payload.name)
        .limit(1)
        .maybeSingle();

    if (dup)
        throw new Error('Объект с такой квартирой в данном проекте уже существует');

    const { data, error } = await supabase
        .from('units')
        .insert({ ...sanitize(payload), project_id })
        .select(SELECT)
        .single();

    if (error) throw error;

    return { ...data, persons: [] };
};

export const useAddUnit = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn: (payload) => createUnit(payload, projectId),
        onSuccess : () => qc.invalidateQueries({ queryKey: ['units', projectId] }),
    });
};

/* ====================== UPDATE ====================== */
const updateUnit = async ({ id, updates }, project_id) => {
    // проверка дубликата при смене номера
    if (updates.name) {
        const { data: dup } = await supabase
            .from('units')
            .select('id')
            .eq('project_id', project_id)
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
        .eq('project_id', project_id)
        .select(SELECT)
        .single();

    if (error) throw error;

    return {
        ...data,
        persons: data.unit_persons?.map((l) => l.person) ?? [],
    };
};

export const useUpdateUnit = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn: (args) => updateUnit(args, projectId),
        onSuccess : () => qc.invalidateQueries({ queryKey: ['units', projectId] }),
    });
};

/* ====================== DELETE ====================== */
export const useDeleteUnit = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('units')
                .delete()
                .eq('id', id)
                .eq('project_id', projectId);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['units', projectId] }),
    });
};
