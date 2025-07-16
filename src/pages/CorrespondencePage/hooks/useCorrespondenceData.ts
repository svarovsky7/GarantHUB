import { useMemo } from 'react';
import { useLetters } from '@/entities/correspondence';
import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useVisibleProjects } from '@/entities/project';
import { useUnitsByProject, useUnitsByIds, useLockedUnitIds } from '@/entities/unit';
import { useLetterStatuses } from '@/entities/letterStatus';
import { useContractors } from '@/entities/contractor';
import { usePersons } from '@/entities/person';
import dayjs from 'dayjs';

interface Filters {
  period?: [dayjs.Dayjs, dayjs.Dayjs] | null;
  type?: 'incoming' | 'outgoing' | '';
  id?: number[];
  category?: number | '';
  project?: number | '';
  building?: string | '';
  unit?: number | '';
  sender?: string;
  receiver?: string;
  subject?: string;
  content?: string;
  status?: number | '';
  responsible?: string | '';
  hideClosed?: boolean;
}

export function useCorrespondenceData(filters: Filters) {
  // Data queries
  const { data: letters = [] } = useLetters();
  const { data: users = [] } = useUsers();
  const { data: letterTypes = [] } = useLetterTypes();
  const { data: statuses = [] } = useLetterStatuses();
  const { data: contractors = [] } = useContractors();
  const { data: persons = [] } = usePersons();
  const { data: projects = [] } = useVisibleProjects();
  const { data: projectUnits = [] } = useUnitsByProject(
    filters.project ? Number(filters.project) : null,
  );

  const unitIds = useMemo(
    () => Array.from(new Set(letters.flatMap((l) => l.unit_ids))),
    [letters],
  );
  const { data: allUnits = [] } = useUnitsByIds(unitIds);
  const { data: lockedUnitIds = [] } = useLockedUnitIds();

  // Options for filters
  const contactOptions = useMemo(
    () => [
      ...contractors.map((c) => ({ value: c.name, label: c.name })),
      ...persons.map((p) => ({ value: p.full_name, label: p.full_name })),
    ],
    [contractors, persons],
  );

  const idOptions = useMemo(
    () => letters.map((l) => ({ value: l.id, label: String(l.id) })),
    [letters],
  );

  const buildingOptions = useMemo(() => {
    const buildings = new Set<string>();
    allUnits.forEach(unit => {
      if (unit.building && unit.building.trim()) {
        buildings.add(unit.building.trim());
      }
    });
    return Array.from(buildings).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).map(building => ({
      value: building,
      label: building
    }));
  }, [allUnits]);

  // Filter letters
  const closedStatusId = useMemo(
    () => statuses.find((s) => /закры/i.test(s.name))?.id ?? null,
    [statuses],
  );

  const filteredLetters = useMemo(() => {
    return letters.filter((l) => {
      if (filters.period && filters.period.length === 2) {
        const [from, to] = filters.period;
        const d = dayjs(l.date);
        if (d.isBefore(from, 'day') || d.isAfter(to, 'day')) return false;
      }
      if (filters.type && l.type !== filters.type) return false;
      if (filters.category && l.letter_type_id !== Number(filters.category)) return false;
      if (filters.project && l.project_id !== Number(filters.project)) return false;
      if (filters.building) {
        const letterUnits = allUnits.filter(unit => l.unit_ids.includes(unit.id));
        const hasBuilding = letterUnits.some(unit => unit.building === filters.building);
        if (!hasBuilding) return false;
      }
      if (filters.unit && !l.unit_ids.includes(Number(filters.unit))) return false;
      if (filters.id && filters.id.length) {
        const ids = filters.id.map(String);
        if (!ids.includes(String(l.id))) return false;
      }
      if (filters.status && l.status_id !== Number(filters.status)) return false;
      if (filters.responsible && String(l.responsible_user_id) !== filters.responsible) return false;
      
      const sender = (l.sender || '').toLowerCase();
      const receiver = (l.receiver || '').toLowerCase();
      const subject = (l.subject || '').toLowerCase();
      const content = (l.content || '').toLowerCase();

      if (filters.sender && !sender.includes(filters.sender.toLowerCase()))
        return false;
      if (filters.receiver && !receiver.includes(filters.receiver.toLowerCase()))
        return false;
      if (filters.subject && !subject.includes(filters.subject.toLowerCase()))
        return false;
      if (filters.content && !content.includes(filters.content.toLowerCase()))
        return false;
      if (filters.hideClosed && closedStatusId != null && l.status_id === closedStatusId)
        return false;
      
      return true;
    });
  }, [letters, filters, allUnits, closedStatusId]);

  // Statistics
  const totalLetters = letters.length;
  const closedCount = useMemo(
    () => letters.filter((l) => closedStatusId != null && l.status_id === closedStatusId).length,
    [letters, closedStatusId],
  );
  const openCount = totalLetters - closedCount;
  const readyToExport = filteredLetters.length;

  return {
    // Raw data
    letters,
    users,
    letterTypes,
    statuses,
    contractors,
    persons,
    projects,
    projectUnits,
    allUnits,
    lockedUnitIds,
    
    // Filtered data
    filteredLetters,
    
    // Options
    contactOptions,
    idOptions,
    buildingOptions,
    
    // Statistics
    totalLetters,
    closedCount,
    openCount,
    readyToExport,
  };
}