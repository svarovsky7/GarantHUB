import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { AttachmentType } from '@/shared/types/attachmentType';

const TABLE = 'attachment_types';
const KEY = [TABLE];

export const useAttachmentTypes = ():
    ReturnType<typeof useQuery<AttachmentType[]>> =>
    useQuery<AttachmentType[]>({
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

const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
    qc.invalidateQueries({ queryKey: KEY });

export const useAddAttachmentType = () => {
    const qc = useQueryClient();
    return useMutation<AttachmentType, Error, string>({
        mutationFn: async (name: string): Promise<AttachmentType> => {
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

export const useUpdateAttachmentType = () => {
    const qc = useQueryClient();
    return useMutation<AttachmentType, Error, { id: number; name: string }>({
        mutationFn: async ({ id, name }): Promise<AttachmentType> => {
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

export const useDeleteAttachmentType = () => {
    const qc = useQueryClient();
    return useMutation<void, Error, number>({
        mutationFn: async (id: number): Promise<void> => {
            const { error } = await supabase.from(TABLE).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(qc),
    });
};
