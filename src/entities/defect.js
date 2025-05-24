import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';

export const useProjectDefects = () => {
    const projectId = useProjectId();
    return useQuery({
        queryKey: ['defects', projectId],
        enabled: !!projectId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('defects')
                .select('id, description, fix_cost')
                .eq('project_id', projectId)
                .order('id');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });
};
