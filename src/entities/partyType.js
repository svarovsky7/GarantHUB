import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';

const TABLE = 'party_types';
const KEY = [TABLE];

export const usePartyTypes = () =>
    useQuery({
        queryKey: KEY,
        queryFn : async () => {
            const { data, error } = await supabase
                .from(TABLE)
                .select('id, name')
                .order('id');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });

const invalidate = (qc) => qc.invalidateQueries({ queryKey: KEY });

export const useAddPartyType = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (name) => {
            const { data, error } = await supabase
                .from(TABLE)
                .insert({ name })
                .select('id, name')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => invalidate(qc),
    });
};

export const useUpdatePartyType = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, name }) => {
            const { data, error } = await supabase
                .from(TABLE)
                .update({ name })
                .eq('id', id)
                .select('id, name')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => invalidate(qc),
    });
};

export const useDeletePartyType = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from(TABLE).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(qc),
    });
};
