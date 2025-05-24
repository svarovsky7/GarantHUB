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

const TABLE = 'litigation_stages';
const KEY   = [TABLE];

/* ----------------------- READ ----------------------- */
/** @returns {import('@tanstack/react-query').UseQueryResult<Array<{id:number,name:string}>>} */
export const useLitigationStages = () =>
    useQuery({
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
const invalidate = (qc) => qc.invalidateQueries({ queryKey: KEY });

/** Добавить стадию */
export const useAddLitigationStage = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ name }) => {
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
    return useMutation({
        mutationFn: async ({ id, updates }) => {
            const { error } = await supabase.from(TABLE).update(updates).eq('id', id);
            if (error) throw error;
            return { id, ...updates };
        },
        onSuccess: () => invalidate(qc),
    });
};

/** Удалить стадию */
export const useDeleteLitigationStage = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from(TABLE).delete().eq('id', id);
            if (error) throw error;
            return id;
        },
        onSuccess: () => invalidate(qc),
    });
};
