// src/entities/ticketType.js
// -----------------------------------------------------------------------------
// CRUD-hooks для ticket_types с фильтрацией по project_id текущего пользователя
// -----------------------------------------------------------------------------
// Основано на исходной версии  :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';

/* ---------------- select ---------------- */
export const useTicketTypes = () => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: ['ticket_types', projectId],
        enabled : !!projectId,
        queryFn : async () => {
            const { data, error } = await supabase
                .from('ticket_types')
                .select('id, name')
                .eq('project_id', projectId)
                .order('id');
            if (error) throw error;
            return data ?? [];
        },
    });
};

/* ---------------- insert ---------------- */
export const useAddTicketType = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn: async (name) => {
            const { data, error } = await supabase
                .from('ticket_types')
                .insert({ name, project_id: projectId })
                .select('id, name')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket_types', projectId] }),
    });
};

/* ---------------- update ---------------- */
export const useUpdateTicketType = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, name }) => {
            const { data, error } = await supabase
                .from('ticket_types')
                .update({ name })
                .eq('id', id)
                .eq('project_id', projectId)
                .select('id, name')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket_types', projectId] }),
    });
};

/* ---------------- delete ---------------- */
export const useDeleteTicketType = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('ticket_types')
                .delete()
                .eq('id', id)
                .eq('project_id', projectId);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket_types', projectId] }),
    });
};
