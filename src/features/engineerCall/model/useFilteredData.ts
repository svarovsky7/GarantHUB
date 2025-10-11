import { useMemo } from 'react';

interface Unit {
  id: number;
  name: string;
  building: string;
  project_id: number;
}

interface Claim {
  id: number;
  claim_no: string;
  project_id: number;
  unit_ids: number[];
}

export const useFilteredData = (
  units: Unit[],
  claims: Claim[],
  selectedProject: number | null,
  selectedBuilding: string | null
) => {
  // Filter and sort units
  const filteredUnits = useMemo(() => {
    if (!selectedProject || units.length === 0) return [];

    let unitsToSort = units;

    if (selectedBuilding) {
      unitsToSort = units.filter((u) => u.building === selectedBuilding);
    }

    const sortedUnits = [...unitsToSort].sort((a, b) => {
      const aMatch = a.name.match(/^(\d+)(.*)$/);
      const bMatch = b.name.match(/^(\d+)(.*)$/);

      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1]);
        const bNum = parseInt(bMatch[1]);

        if (aNum !== bNum) return aNum - bNum;
        return (aMatch[2] || '').localeCompare(bMatch[2] || '', 'ru');
      }

      return a.name.localeCompare(b.name, 'ru');
    });

    return sortedUnits;
  }, [units, selectedProject, selectedBuilding]);

  // Sort claims
  const filteredClaims = useMemo(() => {
    return [...claims].sort((a, b) => {
      const aNo = a.claim_no || '';
      const bNo = b.claim_no || '';

      const aMatch = aNo.match(/(\d+)/);
      const bMatch = bNo.match(/(\d+)/);

      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1]);
        const bNum = parseInt(bMatch[1]);

        if (aNum !== bNum) return aNum - bNum;
      }

      return aNo.localeCompare(bNo, 'ru');
    });
  }, [claims]);

  return {
    filteredUnits,
    filteredClaims,
  };
};
