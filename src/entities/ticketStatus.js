// src/entities/ticketStatus.js
// -------------------------------------------------------------
// CRUD-hooks для ticket_statuses
// -------------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

/* ---------------- helpers ---------------- */
const TABLE = 'ticket_statuses';
const KEY   = ['ticket_statuses'];

/* ---------------- select all ---------------- */
export const useTicketStatuses = () =>
    useQuery({
        queryKey: KEY,
        queryFn : async () => {
            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .order('id');
            if (error) throw error;
            return data;
        },
    });

/* ---------------- add ---------------- */
export const useAddTicketStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (values) => {
            const { data, error } = await supabase
                .from(TABLE)
                .insert(values)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    });
};

/* ---------------- update ---------------- */
export const useUpdateTicketStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }) => {
            const { data, error } = await supabase
                .from(TABLE)
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    });
};

/* ---------------- delete ---------------- */
export const useDeleteTicketStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq('id', id);
            if (error) throw error;
            return id;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    });
};
