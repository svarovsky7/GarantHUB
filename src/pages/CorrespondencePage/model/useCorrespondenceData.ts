import { useMemo } from 'react';
import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useVisibleProjects } from '@/entities/project';
import { useUnitsByProject, useUnitsByIds, useLockedUnitIds } from '@/entities/unit';
import { useLetterStatuses } from '@/entities/letterStatus';
import { useContractors } from '@/entities/contractor';
import { usePersons } from '@/entities/person';
import { useLetters } from '@/entities/correspondence';

/**
 * Hook for fetching all correspondence-related data
 */
export function useCorrespondenceData(projectId: number | string | '') {
  const { data: letters = [] } = useLetters();
  const { data: users = [] } = useUsers();
  const { data: letterTypes = [] } = useLetterTypes();
  const { data: statusesData = [] } = useLetterStatuses();
  const { data: contractors = [] } = useContractors();
  const { data: persons = [] } = usePersons();
  const { data: projects = [] } = useVisibleProjects();

  // Cast Status[] to LetterStatus[] (LetterStatus extends Status)
  const statuses = statusesData as any[];
  const { data: projectUnits = [] } = useUnitsByProject(
    projectId ? Number(projectId) : null,
  );

  const unitIds = useMemo(
    () => Array.from(new Set(letters.flatMap((l) => l.unit_ids))),
    [letters],
  );
  const { data: allUnits = [] } = useUnitsByIds(unitIds);
  const { data: lockedUnitIds = [] } = useLockedUnitIds();

  const closedStatusId = useMemo(
    () => statuses.find((s) => /закры/i.test(s.name))?.id ?? null,
    [statuses],
  );

  return {
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
    closedStatusId,
  };
}
