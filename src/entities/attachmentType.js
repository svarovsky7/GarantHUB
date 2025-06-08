import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';

const TABLE = 'attachment_types';
const KEY = [TABLE];

/** Получить список типов вложений */
export const useAttachmentTypes = () =>
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

/** Создать новый тип вложения */
export const useAddAttachmentType = () => {
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

/** Обновить существующий тип вложения */
export const useUpdateAttachmentType = () => {
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

/** Удалить тип вложения */
export const useDeleteAttachmentType = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from(TABLE).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(qc),
    });
};

