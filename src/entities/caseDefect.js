import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useCaseDefects = (caseId) => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: ['case_defects', projectId, caseId],
        enabled: !!projectId && !!caseId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('court_case_defects')
                .select('case_id, defect:defects ( id, description, fix_cost )')
                .eq('case_id', caseId)
                .eq('defects.project_id', projectId);
            if (error) throw error;
            return (
                data?.map((d) => ({
                    case_id: d.case_id,
                    id: d.defect.id,
                    description: d.defect.description,
                    fix_cost: d.defect.fix_cost,
                })) ?? []
            );
        },
        staleTime: 5 * 60_000,
    });
};

const insertLink = async ({ case_id, defect_id }) => {
    const { error } = await supabase
        .from('court_case_defects')
        .upsert({ case_id, defect_id }, { ignoreDuplicates: true });
    if (error) throw error;
};

export const useAddCaseDefect = () => {
    const qc = useQueryClient();
    const projectId = useProjectId();
    return useMutation({
        mutationFn: insertLink,
        onSuccess: (_, vars) => {
            qc.invalidateQueries({
                queryKey: ['case_defects', projectId, vars.case_id],
            });
        },
    });
};

const deleteLink = async ({ case_id, defect_id }) => {
    const { error } = await supabase
        .from('court_case_defects')
        .delete()
        .eq('case_id', case_id)
        .eq('defect_id', defect_id);
    if (error) throw error;
};

export const useDeleteCaseDefect = () => {
    const qc = useQueryClient();
    const projectId = useProjectId();
    return useMutation({
        mutationFn: deleteLink,
        onSuccess: (_, vars) => {
            qc.invalidateQueries({
                queryKey: ['case_defects', projectId, vars.case_id],
            });
        },
    });
};
