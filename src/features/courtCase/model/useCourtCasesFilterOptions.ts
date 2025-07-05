import { useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { naturalCompare } from '@/shared/utils/naturalSort';
import type { CourtCasesFiltersValues } from '@/shared/types/courtCasesFilters';
import type { CourtCase } from '@/shared/types/courtCase';
import type { Project } from '@/shared/types/project';
import type { Unit } from '@/shared/types/unit';
import type { CourtCaseStatus } from '@/shared/types/courtCaseStatus';
import type { User } from '@/shared/types/user';

export interface FilterOptionsResult {
  filteredCases: (CourtCase & any)[];
  projectOptions: Project[];
  buildingOptions: string[];
  unitOptions: Unit[];
  statusOptions: CourtCaseStatus[];
  userOptions: User[];
  idOptions: { value: number; label: string }[];
}

/**
 * Calculate filtered cases and available filter options based on other filters.
 */
export function useCourtCasesFilterOptions(
  cases: (CourtCase & any)[],
  projects: Project[],
  units: Unit[],
  stages: CourtCaseStatus[],
  users: User[],
  filters: CourtCasesFiltersValues,
  closedStageId?: number,
): FilterOptionsResult {
  const matchesFilters = useCallback(
    (c: any, ignore: (keyof CourtCasesFiltersValues)[] = []) => {
      const skip = (key: keyof CourtCasesFiltersValues) => ignore.includes(key);
      if (!skip('status') && filters.status && c.status !== filters.status)
        return false;
      if (!skip('projectId') && filters.projectId && c.project_id !== filters.projectId)
        return false;
      if (!skip('objectId') && filters.objectId && !(c.unit_ids ?? []).includes(filters.objectId))
        return false;
      if (!skip('building') && filters.building && !(c.buildingNamesList ?? []).includes(filters.building))
        return false;
      if (!skip('number') && filters.number && !c.number.toLowerCase().includes(filters.number.toLowerCase()))
        return false;
      if (!skip('uid') && filters.uid && !(c.caseUid || '').toLowerCase().includes(filters.uid.toLowerCase()))
        return false;
      if (!skip('parties') && filters.parties && !(c.plaintiffs + ' ' + c.defendants).toLowerCase().includes(filters.parties.toLowerCase()))
        return false;
      if (!skip('description') && filters.description && !(c.description || '').toLowerCase().includes(filters.description.toLowerCase()))
        return false;
      if (!skip('dateRange') && filters.dateRange && !(dayjs(c.date).isSameOrAfter(filters.dateRange[0], "day") && dayjs(c.date).isSameOrBefore(filters.dateRange[1], "day")))
        return false;
        if (!skip('fixStartRange') && filters.fixStartRange && !(c.fix_start_date && dayjs(c.fix_start_date).isSameOrAfter(filters.fixStartRange[0], 'day') && dayjs(c.fix_start_date).isSameOrBefore(filters.fixStartRange[1], 'day')))
        return false;
      if (!skip('lawyerId') && filters.lawyerId && String(c.responsible_lawyer_id) !== filters.lawyerId)
        return false;
      if (!skip('hideClosed') && filters.hideClosed && closedStageId && c.status === closedStageId)
        return false;
      if (!skip('ids') && filters.ids && !filters.ids.includes(c.id))
        return false;
      return true;
    },
    [filters, closedStageId],
  );

  const filteredCases = useMemo(
    () => cases.filter((c) => matchesFilters(c)),
    [cases, matchesFilters],
  );

  const filterExcept = useCallback(
    (keys: (keyof CourtCasesFiltersValues)[]) =>
      cases.filter((c) => matchesFilters(c, keys)),
    [cases, matchesFilters],
  );

  const projectOptions = useMemo(() => {
    const list = Array.from(new Set(filterExcept(['projectId']).map((c) => c.project_id).filter(Boolean)));
    return projects.filter((p) => list.includes(p.id));
  }, [filterExcept, projects]);

  const unitList = useMemo(() => {
    const ids = Array.from(
      new Set(
        filterExcept(['objectId', 'building']).flatMap((c) => c.unit_ids ?? []).filter(Boolean),
      ),
    );
    return units.filter((u) => ids.includes(u.id));
  }, [filterExcept, units]);

  const buildingOptions = useMemo(() => {
    const set = new Set<string>();
    unitList.forEach((u) => {
      if (u.building) set.add(u.building);
    });
    return Array.from(set).sort(naturalCompare);
  }, [unitList]);

  const unitOptions = useMemo(() => unitList, [unitList]);

  const statusOptions = useMemo(() => {
    const list = Array.from(new Set(filterExcept(['status']).map((c) => c.status).filter(Boolean)));
    return stages.filter((s) => list.includes(s.id));
  }, [filterExcept, stages]);

  const userOptions = useMemo(() => {
    const list = Array.from(
      new Set(filterExcept(['lawyerId']).map((c) => c.responsible_lawyer_id).filter(Boolean)),
    );
    return users.filter((u) => list.includes(u.id));
  }, [filterExcept, users]);

  const idOptions = useMemo(
    () => filterExcept(['ids']).map((c) => ({ value: c.id, label: String(c.id) })),
    [filterExcept],
  );

  return {
    filteredCases,
    projectOptions,
    buildingOptions,
    unitOptions,
    statusOptions,
    userOptions,
    idOptions,
  };
}
