import { supabase } from '@shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const FIELDS =
    'unit_id, person:persons(id, full_name, phone, email)';

export const useUnitPersons = (unitId) =>
    useQuery({
        queryKey: ['unit_persons', unitId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('unit_persons')
                .select(FIELDS)
                .eq('unit_id', unitId);
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!unitId,
    });

export const useAddUnitPerson = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ unit_id, person_id }) => {
            const { error } = await supabase
                .from('unit_persons')
                .insert({ unit_id, person_id })
                .select()
                .single();
            if (error) throw error;
        },
        onSuccess: (_, vars) =>
            qc.invalidateQueries({ queryKey: ['unit_persons', vars.unit_id] }),
    });
};

export const useDeleteUnitPerson = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ unit_id, person_id }) => {
            const { error } = await supabase
                .from('unit_persons')
                .delete()
                .eq('unit_id', unit_id)
                .eq('person_id', person_id);
            if (error) throw error;
        },
        onSuccess: (_, vars) =>
            qc.invalidateQueries({ queryKey: ['unit_persons', vars.unit_id] }),
    });
};
