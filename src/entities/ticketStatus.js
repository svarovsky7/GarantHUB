// src/entities/ticketStatus.js
// -----------------------------------------------------------------------------
// CRUD-hooks для ticket_statuses с фильтрацией по project_id текущего пользователя
// -----------------------------------------------------------------------------
// Основано на исходной версии  :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

/* ---------------- constants ---------------- */
const TABLE = 'ticket_statuses';

/* ---------------- select all ---------------- */
export const useTicketStatuses = () => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: [TABLE, projectId],
        enabled : !!projectId,
        queryFn : async () => {
            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .eq('project_id', projectId)
                .order('id');
            if (error) throw error;
            return data;
        },
    });
};

/* ---------------- add ---------------- */
export const useAddTicketStatus = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn: async (values) => {
            const payload = { ...values, project_id: projectId };
            const { data, error } = await supabase
                .from(TABLE)
                .insert(payload)
                .select('*')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE, projectId] }),
    });
};

/* ---------------- update ---------------- */
export const useUpdateTicketStatus = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, updates }) => {
            const { data, error } = await supabase
                .from(TABLE)
                .update(updates)
                .eq('id', id)
                .eq('project_id', projectId)
                .select('*')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE, projectId] }),
    });
};

/* ---------------- delete ---------------- */
export const useDeleteTicketStatus = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq('id', id)
                .eq('project_id', projectId);
            if (error) throw error;
            return id;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE, projectId] }),
    });
};
