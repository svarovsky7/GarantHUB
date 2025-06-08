import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { LetterType } from '@/shared/types/letterType';

const TABLE = 'letter_types';
const KEY = [TABLE];

export const useLetterTypes = ():
    ReturnType<typeof useQuery<LetterType[]>> =>
    useQuery<LetterType[]>({
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

export const useAddLetterType = () => {
    const qc = useQueryClient();
    return useMutation<LetterType, Error, string>({
        mutationFn: async (name: string): Promise<LetterType> => {
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

export const useUpdateLetterType = () => {
    const qc = useQueryClient();
    return useMutation<LetterType, Error, { id: number; name: string }>({
        mutationFn: async ({ id, name }): Promise<LetterType> => {
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

export const useDeleteLetterType = () => {
    const qc = useQueryClient();
    return useMutation<void, Error, number>({
        mutationFn: async (id: number): Promise<void> => {
            const { error } = await supabase.from(TABLE).delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(qc),
    });
};
