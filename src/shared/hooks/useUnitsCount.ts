import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/shared/api/supabaseClient';

/**
 * Получить количество объектов в проекте и в выбранном корпусе.
 */
export function useUnitsCount(projectId?: string | number, building?: string) {
  const [projectCount, setProjectCount] = useState(0);
  const [buildingCount, setBuildingCount] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!projectId) {
      setProjectCount(0);
      setBuildingCount(0);
      return;
    }
    const { count: prjCount } = await supabase
      .from('units')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);
    setProjectCount(prjCount ?? 0);

    if (building) {
      const { count: bldCount } = await supabase
        .from('units')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('building', building);
      setBuildingCount(bldCount ?? 0);
    } else {
      setBuildingCount(0);
    }
  }, [projectId, building]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel('units-count-' + projectId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'units',
        filter: `project_id=eq.${projectId}`,
      }, fetchCounts);
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [projectId, fetchCounts]);

  return { projectCount, buildingCount, refresh: fetchCounts };
}
