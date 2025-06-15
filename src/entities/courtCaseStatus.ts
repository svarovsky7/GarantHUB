// src/entities/courtCaseStatus.ts
// -----------------------------------------------------------------------------
// Справочник стадий судебного дела (глобальный, без project_id)
// -----------------------------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import type { CourtCaseStatus } from '@/shared/types/courtCaseStatus';

const TABLE = 'court_cases_statuses';
const KEY = [TABLE];

/* ----------------------- READ ----------------------- */
/** @returns {import('@tanstack/react-query').UseQueryResult<Array<{id:number,name:string}>>} */
export const useCourtCaseStatuses = () =>
    useQuery<CourtCaseStatus[]>({
        queryKey: KEY,
        queryFn : async () => {
            const { data, error } = await supabase
                .from(TABLE)
                .select('id, name, color')
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
export const useAddCourtCaseStatus = () => {
    const qc = useQueryClient();
    return useMutation<CourtCaseStatus, Error, { name: string; color: string }>({
        mutationFn: async ({ name, color }): Promise<CourtCaseStatus> => {
            if (!name?.trim()) throw new Error('Название стадии обязательно');
            const { data, error } = await supabase
                .from(TABLE)
                .insert({ name: name.trim(), color })
                .select('id, name, color')
                .single();
            if (error) throw error;
            return data as CourtCaseStatus;
        },
        onSuccess: () => invalidate(qc),
    });
};

/** Обновить стадию */
export const useUpdateCourtCaseStatus = () => {
    const qc = useQueryClient();
    return useMutation<CourtCaseStatus, Error, { id: number; updates: Partial<Omit<CourtCaseStatus, 'id'>> }>({
        mutationFn: async ({ id, updates }): Promise<CourtCaseStatus> => {
            const { error } = await supabase.from(TABLE).update(updates).eq('id', id);
            if (error) throw error;
            return { id, ...(updates as Partial<CourtCaseStatus>) } as CourtCaseStatus;
        },
        onSuccess: () => invalidate(qc),
    });
};

/** Удалить стадию */
export const useDeleteCourtCaseStatus = () => {
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
