import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type {
  ContractorCompletion,
  ContractorCompletionCreate,
  ContractorCompletionUpdate,
  ContractorCompletionWithDetails,
  CompletionDefectCreate,
} from '@/shared/types/contractorCompletion';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { filterByProjects } from '@/shared/utils/projectQuery';

const QUERY_KEY = 'contractor-completions';

/**
 * Получить все выполнения с деталями
 */
export function useContractorCompletions() {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();

  return useQuery({
    queryKey: [QUERY_KEY, projectId, projectIds.join(',')],
    queryFn: async (): Promise<ContractorCompletionWithDetails[]> => {
      let query = supabase
        .from('contractor_completions')
        .select(`
          *,
          contractors(name),
          projects(name),
          profiles!contractor_completions_created_by_fkey(name)
        `)
        .order('created_at', { ascending: false });

      query = filterByProjects(query, projectId, projectIds, onlyAssigned);

      const { data, error } = await query;
      if (error) throw error;

      // Получаем количество дефектов для каждого выполнения
      const completionIds = data?.map((c) => c.id) || [];
      const { data: defectCounts } = await supabase
        .from('completion_defects')
        .select('completion_id')
        .in('completion_id', completionIds);

      const countsMap = new Map<number, number>();
      defectCounts?.forEach((cd) => {
        countsMap.set(cd.completion_id, (countsMap.get(cd.completion_id) || 0) + 1);
      });

      return (
        data?.map((completion) => ({
          ...completion,
          contractorName: completion.contractors?.name || null,
          projectName: completion.projects?.name || null,
          createdByName: completion.profiles?.name || null,
          defectsCount: countsMap.get(completion.id) || 0,
        })) || []
      );
    },
    enabled: true,
  });
}

/**
 * Получить выполнение по ID
 */
export function useContractorCompletion(id: number | null) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async (): Promise<ContractorCompletionWithDetails | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('contractor_completions')
        .select(`
          *,
          contractors(name),
          projects(name),
          profiles!contractor_completions_created_by_fkey(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        contractorName: data.contractors?.name || null,
        projectName: data.projects?.name || null,
        createdByName: data.profiles?.name || null,
      };
    },
    enabled: !!id,
  });
}

/**
 * Создать новое выполнение
 */
export function useAddContractorCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (completion: ContractorCompletionCreate) => {
      const { data, error } = await supabase
        .from('contractor_completions')
        .insert(completion)
        .select()
        .single();

      if (error) throw error;
      return data as ContractorCompletion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Обновить выполнение
 */
export function useUpdateContractorCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: ContractorCompletionUpdate;
    }) => {
      const { data, error } = await supabase
        .from('contractor_completions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ContractorCompletion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Удалить выполнение
 */
export function useDeleteContractorCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('contractor_completions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Получить дефекты для выполнения
 */
export function useCompletionDefects(completionId: number | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'defects', completionId],
    queryFn: async () => {
      if (!completionId) return [];

      const { data, error } = await supabase
        .from('completion_defects')
        .select(`
          *,
          defects(
            id,
            description,
            status_id,
            received_at,
            fixed_at,
            defect_status:statuses!fk_defects_status(name, color)
          )
        `)
        .eq('completion_id', completionId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!completionId,
  });
}

/**
 * Добавить дефекты к выполнению
 */
export function useAddCompletionDefects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (links: CompletionDefectCreate[]) => {
      const { data, error } = await supabase
        .from('completion_defects')
        .insert(links)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Удалить связь дефекта с выполнением
 */
export function useRemoveCompletionDefect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ completionId, defectId }: { completionId: number; defectId: number }) => {
      const { error } = await supabase
        .from('completion_defects')
        .delete()
        .eq('completion_id', completionId)
        .eq('defect_id', defectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
