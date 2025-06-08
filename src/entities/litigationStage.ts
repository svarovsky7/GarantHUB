// src/entities/litigationStage.js
// -----------------------------------------------------------------------------
// Справочник стадий судебного дела (глобальный, без project_id)
// -----------------------------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import type { LitigationStage } from '@/shared/types/litigationStage';

const TABLE = 'litigation_stages';
const KEY   = [TABLE];

/* ----------------------- READ ----------------------- */
/** @returns {import('@tanstack/react-query').UseQueryResult<Array<{id:number,name:string}>>} */
export const useLitigationStages = () =>
    useQuery<LitigationStage[]>({
        queryKey: KEY,
        queryFn : async () => {
            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .order('id');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });

/* ---------------------- MUTATIONS -------------------- */
const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
    qc.invalidateQueries({ queryKey: KEY });

/** Добавить стадию */
export const useAddLitigationStage = () => {
    const qc = useQueryClient();
    return useMutation<LitigationStage, Error, { name: string }>({
        mutationFn: async ({ name }): Promise<LitigationStage> => {
            if (!name?.trim()) throw new Error('Название стадии обязательно');
            const { data, error } = await supabase
                .from(TABLE)
                .insert({ name: name.trim() })
                .select('*')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => invalidate(qc),
    });
};

/** Обновить стадию */
export const useUpdateLitigationStage = () => {
    const qc = useQueryClient();
    return useMutation<LitigationStage, Error, { id: number; updates: Partial<Omit<LitigationStage, 'id'>> }>({
        mutationFn: async ({ id, updates }): Promise<LitigationStage> => {
            const { error } = await supabase.from(TABLE).update(updates).eq('id', id);
            if (error) throw error;
            return { id, ...(updates as Partial<LitigationStage>) } as LitigationStage;
        },
        onSuccess: () => invalidate(qc),
    });
};

/** Удалить стадию */
export const useDeleteLitigationStage = () => {
    const qc = useQueryClient();
    return useMutation<number, Error, number>({
        mutationFn: async (id: number): Promise<number> => {
            const { error } = await supabase.from(TABLE).delete().eq('id', id);
            if (error) throw error;
            return id;
        },
        onSuccess: () => invalidate(qc),
    });
};
