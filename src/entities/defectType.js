// src/entities/defectType.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';

// ---------------- select ----------------
export const useDefectTypes = () => {
    return useQuery({
        queryKey: ['defect_types'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('defect_types')
                .select('id, name')
                .order('id');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });
};

// ---------------- insert ----------------
/**
 * Creates a new defect type.
 * Throws an error if a type with the same name exists.
 */
export const useAddDefectType = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (name) => {
            const { data: exists, error: selectErr } = await supabase
                .from('defect_types')
                .select('id')
                .eq('name', name)
                .maybeSingle();
            if (selectErr) throw selectErr;
            if (exists) throw new Error('Такой тип дефекта уже существует');

            const { data, error } = await supabase
                .from('defect_types')
                .insert({ name })
                .select('id, name')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['defect_types'] }),
    });
};

// ---------------- update ----------------
export const useUpdateDefectType = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, name }) => {
            const { data, error } = await supabase
                .from('defect_types')
                .update({ name })
                .eq('id', id)
                .select('id, name')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['defect_types'] }),
    });
};

// ---------------- delete ----------------
export const useDeleteDefectType = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('defect_types')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['defect_types'] }),
    });
};
