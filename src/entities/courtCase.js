import { supabase } from '@/shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useProjectId } from '@/shared/hooks/useProjectId';

const FIELDS = `
  id, internal_no, project_id, unit_id, stage_id, status,
  responsible_lawyer_id, fix_start_date, fix_end_date, comments,
  created_at, updated_at,
  projects(id,name),
  units(id,name),
  litigation_stages(id,name),
  profiles(id,name)
`;

const serialize = (data) => ({
    internal_no: data.internal_no.trim(),
    project_id: data.project_id,
    unit_id: data.unit_id ?? null,
    stage_id: data.stage_id ?? null,
    status: data.status,
    responsible_lawyer_id: data.responsible_lawyer_id ?? null,
    fix_start_date: data.fix_start_date ? dayjs(data.fix_start_date).format('YYYY-MM-DD') : null,
    fix_end_date: data.fix_end_date ? dayjs(data.fix_end_date).format('YYYY-MM-DD') : null,
    comments: data.comments?.trim() || null,
});

export const useCourtCases = () => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: ['court_cases', projectId],
        enabled: !!projectId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('court_cases')
                .select(FIELDS)
                .eq('project_id', projectId)
                .order('id');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });
};

const invalidate = (qc, projectId) => qc.invalidateQueries({ queryKey: ['court_cases', projectId] });

export const useAddCourtCase = () => {
    const projectId = useProjectId();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (values) => {
            const { data, error } = await supabase
                .from('court_cases')
                .insert(serialize({ ...values, project_id: projectId }))
                .select('id')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => invalidate(qc, projectId),
    });
};

export const useUpdateCourtCase = () => {
    const projectId = useProjectId();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }) => {
            const { data, error } = await supabase
                .from('court_cases')
                .update(serialize({ ...updates, project_id: projectId }))
                .eq('id', id)
                .select('id')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => invalidate(qc, projectId),
    });
};

export const useDeleteCourtCase = () => {
    const projectId = useProjectId();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('court_cases').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(qc, projectId),
    });
};
