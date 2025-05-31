import { supabase } from '@/shared/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const TABLE = 'defect_deadlines';
const SELECT = `
  id, project_id, ticket_type_id, fix_days,
  project:projects ( id, name ),
  ticket_type:ticket_types ( id, name )
`;

export const useDefectDeadlines = () =>
  useQuery({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(SELECT)
        .order('id');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

export const useAddDefectDeadline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select(SELECT)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};

export const useUpdateDefectDeadline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(updates)
        .eq('id', id)
        .select(SELECT)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};

export const useDeleteDefectDeadline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};
