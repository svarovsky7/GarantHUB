// src/entities/ticketStatus.js
import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

const TABLE = 'ticket_statuses';

// ---------------- select all ----------------
/** Получить все статусы замечаний */
export const useTicketStatuses = () => {
    return useQuery({
        queryKey: [TABLE],
        queryFn: async () => {
            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .order('id');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });
};

// ---------------- add ----------------
/** Создать новый статус замечания */
export const useAddTicketStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (values) => {
            const payload = { ...values }; // color присутствует!
            const { data, error } = await supabase
                .from(TABLE)
                .insert(payload)
                .select('*')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
    });
};

// ---------------- update ----------------
/** Обновить статус замечания */
export const useUpdateTicketStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }) => {
            const { data, error } = await supabase
                .from(TABLE)
                .update(updates) // color будет в updates
                .eq('id', id)
                .select('*')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
    });
};

// ---------------- delete ----------------
/** Удалить статус замечания */
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
        onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
    });
};

