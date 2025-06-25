import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/shared/api/supabaseClient';

/**
 * Загрузка списка корпусов выбранного проекта.
 * Сортировка выполняется в естественном порядке.
 */
export default function useProjectBuildings(projectId?: string | number) {
  const [buildings, setBuildings] = useState<string[]>([]);

  const fetchBuildings = useCallback(async () => {
    if (!projectId) {
      setBuildings([]);
      return;
    }
    const { data } = await supabase.rpc('buildings_by_project', { pid: Number(projectId) });
    const list = (data || [])
      .map((r: any) => r.building)
      .filter(Boolean)
      .sort((a: string, b: string) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
      );
    setBuildings(list);
  }, [projectId]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel('buildings-' + projectId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'units', filter: `project_id=eq.${projectId}` },
        fetchBuildings,
      );
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [projectId, fetchBuildings]);

  return { buildings, refresh: fetchBuildings };
}
