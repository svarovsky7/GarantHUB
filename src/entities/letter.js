import { supabase } from '@/shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useProjectId } from '@/shared/hooks/useProjectId';

const FIELDS = `id, case_id, number, letter_type, letter_date, subject, sender, receiver`;

export const useCaseLetters = (caseId) => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: ['letters', caseId],
        enabled: !!caseId && !!projectId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('letters')
                .select(FIELDS)
                .eq('case_id', caseId)
                .eq('project_id', projectId)
                .order('letter_date');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });
};

const invalidate = (qc, caseId) =>
    qc.invalidateQueries({ queryKey: ['letters', caseId] });

export const useAddLetter = () => {
    const projectId = useProjectId();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ case_id, ...vals }) => {
            const { data, error } = await supabase
                .from('letters')
                .insert({
                    ...vals,
                    case_id,
                    project_id: projectId,
                    letter_date: vals.letter_date
                        ? dayjs(vals.letter_date).format('YYYY-MM-DD')
                        : null,
                })
                .select('id')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => invalidate(qc, vars.case_id),
    });
};

export const useUpdateLetter = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, case_id, updates }) => {
            const { data, error } = await supabase
                .from('letters')
                .update({
                    ...updates,
                    letter_date: updates.letter_date
                        ? dayjs(updates.letter_date).format('YYYY-MM-DD')
                        : null,
                })
                .eq('id', id)
                .select('id')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => invalidate(qc, vars.case_id),
    });
};

export const useDeleteLetter = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, case_id }) => {
            const { error } = await supabase.from('letters').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, vars) => invalidate(qc, vars.case_id),
    });
};
