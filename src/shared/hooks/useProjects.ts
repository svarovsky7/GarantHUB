import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }
      
      return data || [];
    },
  });
}