import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';

export interface DefectType { 
    id: number; 
    name: string;
}

// ---------------- select ----------------
export const useDefectTypes = () => {
    return useQuery<DefectType[]>({
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
export const useAddDefectType = () => {
    const qc = useQueryClient();
    return useMutation<DefectType, Error, string>({
        mutationFn: async (name) => {
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
    return useMutation<DefectType, Error, { id: number; name: string }>({
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
    return useMutation<void, Error, number>({
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