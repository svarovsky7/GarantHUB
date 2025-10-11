import { useMemo } from 'react';
import type { CorrespondenceLetter } from '@/shared/types/correspondence';
import type { Contractor } from '@/shared/types/contractor';
import type { Person } from '@/shared/types/person';
import type { Unit } from '@/shared/types/unit';

/**
 * Hook for generating dropdown options from entities
 */
export function useCorrespondenceOptions(
  letters: CorrespondenceLetter[],
  contractors: Contractor[],
  persons: Person[],
  allUnits: Unit[],
) {
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
    return Array.from(buildings).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    ).map(building => ({
      value: building,
      label: building
    }));
  }, [allUnits]);

  return {
    contactOptions,
    idOptions,
    buildingOptions,
  };
}
