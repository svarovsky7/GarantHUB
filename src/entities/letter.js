import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';

const SELECT = 'id, case_id, number, letter_type, letter_date, subject, sender, receiver';

export const useCaseLetters = (caseId) => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: ['letters', projectId, caseId],
        enabled: !!projectId && !!caseId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('letters')
                .select(SELECT)
                .eq('project_id', projectId)
                .eq('case_id', caseId)
                .order('letter_date');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });
};

const invalidate = (qc, projectId, caseId) => {
    qc.invalidateQueries({ queryKey: ['letters', projectId, caseId] });
};

export const useAddLetter = () => {
    const projectId = useProjectId();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (values) => {
            const { data, error } = await supabase
                .from('letters')
                .insert({
                    ...values,
                    project_id: projectId,
                    letter_date: values.letter_date
                        ? dayjs(values.letter_date).format('YYYY-MM-DD')
                        : null,
                })
                .select('id')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => invalidate(qc, projectId, vars.case_id),
    });
};

export const useUpdateLetter = () => {
    const projectId = useProjectId();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, case_id, updates }) => {
            const { data, error } = await supabase
                .from('letters')
                .update({
                    ...updates,
                    project_id: projectId,
                    letter_date: updates.letter_date
                        ? dayjs(updates.letter_date).format('YYYY-MM-DD')
                        : null,
                })
                .eq('id', id)
                .eq('case_id', case_id)
                .select('id')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => invalidate(qc, projectId, vars.case_id),
    });
};

export const useDeleteLetter = () => {
    const projectId = useProjectId();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, case_id }) => {
            const { error } = await supabase
                .from('letters')
                .delete()
                .eq('id', id)
                .eq('case_id', case_id)
                .eq('project_id', projectId);
            if (error) throw error;
        },
        onSuccess: (_, vars) => invalidate(qc, projectId, vars.case_id),
    });
};
