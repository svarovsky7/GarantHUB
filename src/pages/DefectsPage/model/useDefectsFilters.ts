import { useState, useMemo, useCallback, useEffect } from 'react';
import type { DefectFilters } from '@/shared/types/defectFilters';
import type { DefectWithInfo } from '@/shared/types/defect';
import { filterDefects } from '@/shared/utils/defectFilter';
import { naturalCompare, naturalCompareArrays } from '@/shared/utils/naturalSort';

const LS_FILTERS_VISIBLE_KEY = 'defectsFiltersVisible';

interface UseDefectsFiltersParams {
  defects: DefectWithInfo[];
  units: any[];
  projects: any[];
}

/**
 * Хук для управления фильтрацией дефектов
 */
export function useDefectsFilters({ defects, units, projects }: UseDefectsFiltersParams) {
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_FILTERS_VISIBLE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [filters, setFilters] = useState<DefectFilters>({});

  // Сохранение состояния видимости фильтров
  useEffect(() => {
    try {
      localStorage.setItem(LS_FILTERS_VISIBLE_KEY, JSON.stringify(showFilters));
    } catch {}
  }, [showFilters]);

  // Фильтрованные дефекты
  const filteredDefects = useMemo(
    () => filterDefects(defects, filters),
    [defects, filters],
  );

  // Опции для фильтров
  const filterOptions = useMemo(() => {
    const uniq = (values: (string | number | null | undefined)[]) =>
      Array.from(new Set(values.filter(Boolean) as (string | number)[])).sort(naturalCompare);
    const mapNumOptions = (vals: (number | null | undefined)[]) =>
      uniq(vals).map((v) => ({ label: String(v), value: Number(v) }));
    const mapStrOptions = (vals: (string | null | undefined)[]) =>
      uniq(vals).map((v) => ({ label: String(v), value: String(v) }));

    const uniqPairs = (pairs: [number | null, string | null][]) => {
      const map = new Map<number, string>();
      pairs.forEach(([id, name]) => {
        if (id != null && name) map.set(id, name);
      });
      return Array.from(map.entries())
        .sort((a, b) => naturalCompare(a[1], b[1]))
        .map(([value, label]) => ({ value, label }));
    };

    const unitOptionsMap = new Map(units.map((u) => [u.id, u.name]));
    const projectOptionsMap = new Map(projects.map((p) => [p.id, p.name]));

    return {
      ids: mapNumOptions(filteredDefects.map((d) => d.id)),
      claimIds: mapNumOptions(filteredDefects.flatMap((d) => d.claimIds)),
      units: Array.from(
        new Set(filteredDefects.flatMap((d) => d.unitIds)),
      )
        .map((id) => ({ label: unitOptionsMap.get(id) ?? String(id), value: id }))
        .sort((a, b) => naturalCompare(a.label, b.label)),
      buildings: mapStrOptions(
        filteredDefects.flatMap((d) => d.buildingNamesList || []),
      ),
      projects: Array.from(
        new Set(filteredDefects.flatMap((d) => d.projectIds || [])),
      )
        .map((id) => ({ label: projectOptionsMap.get(id) ?? String(id), value: id }))
        .sort((a, b) => naturalCompare(a.label, b.label)),
      types: uniqPairs(filteredDefects.map((d) => [d.type_id, d.defectTypeName])),
      statuses: uniqPairs(
        filteredDefects.map((d) => [d.status_id, d.defectStatusName]),
      ),
      fixBy: mapStrOptions(filteredDefects.map((d) => d.fixByName)),
      engineers: mapStrOptions(filteredDefects.map((d) => d.engineerName)),
      authors: mapStrOptions(filteredDefects.map((d) => d.createdByName)),
    };
  }, [filteredDefects, units, projects]);

  const handleToggleFilters = useCallback(() => setShowFilters(p => !p), []);
  const handleSubmitFilters = useCallback((newFilters: DefectFilters) => {
    setFilters(newFilters);
  }, []);
  const handleResetFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    showFilters,
    filters,
    filteredDefects,
    filterOptions,
    handleToggleFilters,
    handleSubmitFilters,
    handleResetFilters,
  };
}
