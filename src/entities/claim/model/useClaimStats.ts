import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { filterByProjects } from '@/shared/utils/projectQuery';
import { TABLE } from './mappers';

/**
 * Получить статистику по всем претензиям (общее количество, закрытые, открытые).
 */
export function useClaimsAllStats() {
  return useQuery({
    queryKey: ['claims-all-stats'],
    queryFn: async () => {
      // Получаем общее количество претензий
      const { count: totalCount } = await supabase
        .from(TABLE)
        .select('*', { count: 'exact', head: true });

      // Получаем все статусы для претензий
      const { data: allStatuses } = await supabase
        .from('statuses')
        .select('id, name')
        .eq('entity', 'claim');

      // Фильтруем статусы по тем же критериям что и в фильтре hideClosed
      const closedStatusIds = allStatuses
        ?.filter(s => /(закры|не\s*гаран)/i.test(s.name))
        .map(s => s.id) || [];

      let closedCount = 0;
      if (closedStatusIds.length > 0) {
        // Получаем количество закрытых/не гарантийных претензий
        const { count } = await supabase
          .from(TABLE)
          .select('*', { count: 'exact', head: true })
          .in('claim_status_id', closedStatusIds);
        closedCount = count || 0;
      }

      return {
        total: totalCount || 0,
        closed: closedCount,
        open: (totalCount || 0) - closedCount,
      };
    },
    staleTime: 30_000, // Кешировать на 30 секунд
  });
}

/**
 * Получить статистику по претензиям проекта (общее количество, закрытые, открытые).
 */
export function useClaimsStats() {
  const { projectId, projectIds, onlyAssigned, enabled } = useProjectFilter();

  return useQuery({
    queryKey: ['claims-stats', projectId, projectIds.join(',')],
    enabled,
    queryFn: async () => {
      // Строим базовый запрос
      let baseQuery: any = supabase.from(TABLE).select('*', { count: 'exact', head: true });
      baseQuery = filterByProjects(baseQuery, projectId, projectIds, onlyAssigned);

      // Получаем общее количество претензий
      const { count: totalCount } = await baseQuery;

      // Получаем все статусы для претензий
      const { data: allStatuses } = await supabase
        .from('statuses')
        .select('id, name')
        .eq('entity', 'claim');

      // Фильтруем статусы по тем же критериям что и в фильтре hideClosed
      const closedStatusIds = allStatuses
        ?.filter(s => /(закры|не\s*гаран)/i.test(s.name))
        .map(s => s.id) || [];

      let closedCount = 0;
      if (closedStatusIds.length > 0) {
        // Получаем количество закрытых/не гарантийных претензий
        let closedQuery: any = supabase
          .from(TABLE)
          .select('*', { count: 'exact', head: true })
          .in('claim_status_id', closedStatusIds);
        closedQuery = filterByProjects(closedQuery, projectId, projectIds, onlyAssigned);

        const { count } = await closedQuery;
        closedCount = count || 0;
      }

      return {
        total: totalCount || 0,
        closed: closedCount,
        open: (totalCount || 0) - closedCount,
      };
    },
    staleTime: 30_000, // Кешировать на 30 секунд
  });
}
