import { supabase } from '@/shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DefectDeadline } from '@/shared/types/defectDeadline';

const TABLE = 'defect_deadlines';
const SELECT = `
  id, project_id, ticket_type_id, fix_days,
  project:projects ( id, name ),
  ticket_type:ticket_types ( id, name )
`;

export const useDefectDeadlines = () =>
  useQuery<DefectDeadline[]>({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT)
        .order('id');
      if (error) throw error;
      return (data ?? []) as unknown as DefectDeadline[];
    },
    staleTime: 5 * 60_000,
  });

export const useAddDefectDeadline = () => {
  const qc = useQueryClient();
  return useMutation<DefectDeadline, Error, Omit<DefectDeadline, 'id' | 'project' | 'ticket_type'>>({
    mutationFn: async (
      payload: Omit<DefectDeadline, 'id' | 'project' | 'ticket_type'>,
    ): Promise<DefectDeadline> => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select(SELECT)
        .single();
      if (error) throw error;
      return data as unknown as DefectDeadline;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};

export const useUpdateDefectDeadline = () => {
  const qc = useQueryClient();
  return useMutation<DefectDeadline, Error, { id: number; updates: Partial<Omit<DefectDeadline, 'id' | 'project' | 'ticket_type'>> }>({
    mutationFn: async ({
      id,
      updates,
    }): Promise<DefectDeadline> => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(updates)
        .eq('id', id)
        .select(SELECT)
        .single();
      if (error) throw error;
      return data as unknown as DefectDeadline;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};

export const useDeleteDefectDeadline = () => {
  const qc = useQueryClient();
  return useMutation<number, Error, number>({
    mutationFn: async (id: number): Promise<number> => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};
