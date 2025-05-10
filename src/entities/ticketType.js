import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';

/* SELECT */
export const useTicketTypes = () =>
    useQuery({ queryKey: ['ticket_types'], queryFn: async () => {
            const { data, error } = await supabase.from('ticket_types').select('id, name').order('id');
            if (error) throw error;
            return data ?? [];
        }});

/* INSERT */
export const useAddTicketType = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (name) => {
            const { data, error } = await supabase
                .from('ticket_types')
                .insert({ name })
                .select('id, name')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket_types'] }),
    });
};

/* UPDATE */
export const useUpdateTicketType = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, name }) => {
            const { data, error } = await supabase
                .from('ticket_types')
                .update({ name })
                .eq('id', id)
                .select('id, name')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket_types'] }),
    });
};

/* DELETE */                                 // NEW
export const useDeleteTicketType = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('ticket_types').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket_types'] }),
    });
};
