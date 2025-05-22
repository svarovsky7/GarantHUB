// src/entities/litigation.js
// --------------------------------------------------------
// Судебные дела, изолированные по project_id
// --------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';

const TABLE = 'litigations';

/* ---------- чтение активного дела по объекту ---------- */
export const useLitigationByUnit = (unitId) => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: [TABLE, 'unit', unitId, projectId],
        enabled : !!unitId && !!projectId,
        queryFn : async () => {
            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .eq('project_id', projectId)
                .eq('unit_id', unitId)
                .eq('is_active', true)
                .maybeSingle();
            if (error && error.code !== 'PGRST116') throw error;
            return data ?? null;
        },
        staleTime: 60_000,
    });
};

/* ---------- INSERT ---------- */
const createLitigation = async (payload, project_id) => {
    const { data, error } = await supabase
        .from(TABLE)
        .insert({ ...payload, project_id })
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

export const useAddLitigation = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn : (values) => createLitigation(values, projectId),
        onSuccess  : (row) => {
            qc.invalidateQueries({ queryKey: [TABLE, 'list', projectId] });
            qc.invalidateQueries({ queryKey: [TABLE, 'unit', row.unit_id, projectId] });
        },
    });
};

/* ---------- UPDATE ---------- */
const updateLitigation = async ({ id, updates }) => {
    const { error } = await supabase.from(TABLE).update(updates).eq('id', id);
    if (error) throw error;
};

export const useUpdateLitigation = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn : updateLitigation,
        onSuccess  : () => qc.invalidateQueries({ queryKey: [TABLE, 'list', projectId] }),
    });
};

/* ---------- CLOSE ---------- */
const closeLitigation = async (id) => {
    const { error } = await supabase.from(TABLE).update({ is_active: false }).eq('id', id);
    if (error) throw error;
};

export const useCloseLitigation = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn : closeLitigation,
        onSuccess  : (_, __, ctx) =>
            qc.invalidateQueries({ queryKey: [TABLE, 'unit', ctx?.unitId, projectId] }),
    });
};

/* ---------- список с фильтрами ---------- */
export const useLitigations = ({ search = '', stageId = null } = {}) => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: [TABLE, 'list', projectId, search, stageId],
        enabled : !!projectId,
        queryFn : async () => {
            const qb = supabase
                .from(TABLE)
                .select(`
          *,
          stage:litigation_stages(id,name),
          claimant:persons(id,full_name),
          defendant:contractors(id,name)
        `)
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (stageId) qb.eq('stage_id', stageId);
            if (search)  qb
                .ilike('court_name', `%${search}%`)
                .or(`court_number.ilike.%${search}%`);

            const { data, error } = await qb;
            if (error) throw error;
            return data;
        },
        staleTime: 60_000,
    });
};

/* ---------- live-updates ---------- */
export const useLitigationLiveUpdates = () => {
    const qc = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel(`public:${TABLE}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: TABLE },
                () => {
                    qc.invalidateQueries({ queryKey: [TABLE] });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [qc]);
};
