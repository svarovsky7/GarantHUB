// src/entities/unit.js

import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { useAuthStore } from '@/shared/store/authStore';
import { filterByProjects } from '@/shared/utils/projectQuery';
import { useNotify } from '@/shared/hooks/useNotify';

/* ---------- базовый SELECT ---------- */
const SELECT = `
  id, name, building, section, floor,
  project_id,
  project:projects ( id, name ),
  person_id
`;

// sanitize теперь включает person_id!
const sanitize = (obj) => {
    const allowed = ['name', 'building', 'section', 'floor', 'project_id', 'person_id'];
    return Object.fromEntries(
        Object.entries(obj)
            .filter(([k]) => allowed.includes(k))
            .map(([k, v]) => [k, v === '' ? null : v]),
    );
};

/* ====================== READ ====================== */
export const useUnits = () => {
    const { projectId, projectIds, onlyAssigned, enabled } = useProjectFilter();
    return useQuery({
        queryKey: ['units', projectId, projectIds.join(',')],
        enabled,
        queryFn : async () => {
            let query = supabase.from('units').select(SELECT);
            query = filterByProjects(query, projectId, projectIds, onlyAssigned);
            query = query.order('id');
            const { data, error } = await query;

            if (error) throw error;

            return (data ?? []).map((u) => ({
                ...u,
                persons: [], // unit_persons removed
            }));
        },
        staleTime: 5 * 60_000,
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
                persons: [], // unit_persons removed
            }));
        },
        staleTime: 5 * 60_000,
    });


export const useUnitsByIds = (ids) =>
    useQuery({
        queryKey: ['units-by-ids', ids?.join(',')],
        enabled : Array.isArray(ids) && ids.length > 0,
        queryFn : async () => {
            const { data, error } = await supabase
                .from('units')
                .select('id, name, building, section, floor')
                .in('id', ids);
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });

export const useUnit = (unitId) => {
    const { projectId, projectIds, onlyAssigned, enabled: baseEnabled } = useProjectFilter();
    return useQuery({
        queryKey: ['unit', unitId, projectId, projectIds.join(',')],
        enabled : !!unitId && baseEnabled,
        queryFn : async () => {
            let query = supabase
                .from('units')
                .select(SELECT)
                .eq('id', unitId);
            query = filterByProjects(query, projectId, projectIds, onlyAssigned);
            query = query.single();
            const { data, error } = await query;

            if (error) throw error;

            return {
                ...data,
                persons: [], // unit_persons removed
            };
        },
        staleTime: 5 * 60_000,
    });
};

/* ====================== CREATE ====================== */
const createUnit = async (payload) => {
    // Защита от дублей (квартира + проект уникальны)
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
    const userId = useAuthStore((s) => s.profile?.id ?? null);
    return useMutation({
        mutationFn: (payload) => {
            if (!userId) throw new Error('Профиль пользователя не загружен');
            // person_id обязательно подставляется сюда:
            return createUnit({ ...payload, person_id: userId });
        },
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
        persons: [], // unit_persons removed
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

/** Удалить все квартиры в корпусе */
export const useDeleteUnitsByBuilding = () => {
    const qc = useQueryClient();
    const notify = useNotify();
    return useMutation({
        mutationFn: async ({ projectId, building }: { projectId: string | number; building: string }) => {
            const { error } = await supabase
                .from('units')
                .delete()
                .eq('project_id', projectId)
                .eq('building', building);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['units'] });
            notify.success('Корпус удалён');
        },
        onError: (e: Error) => notify.error(e.message),
    });
};

/** Удалить все квартиры в секции корпуса */
export const useDeleteUnitsBySection = () => {
    const qc = useQueryClient();
    const notify = useNotify();
    return useMutation({
        mutationFn: async ({ projectId, building, section }: { projectId: string | number; building: string; section: string }) => {
            const { error } = await supabase
                .from('units')
                .delete()
                .eq('project_id', projectId)
                .eq('building', building)
                .eq('section', section);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['units'] });
            notify.success('Секция удалена');
        },
        onError: (e: Error) => notify.error(e.message),
    });
};
