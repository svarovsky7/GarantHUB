import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/shared/store/authStore';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';
import type { UnitsMatrixData } from '@/shared/types/unitsMatrix';
import type { Unit } from '@/shared/types/unit';
import type { UnitClaimInfo } from '@/shared/types/unitClaimInfo';

/**
 * Универсальный хук для шахматки квартир.
 * Загружает объекты проекта и связанные сущности:
 * - активные судебные дела
 * - письма, связанные с объектами
 * - претензии с их статусами
 *
 * @param projectId ID проекта
 * @param building  Корпус
 */
export default function useUnitsMatrix(projectId: number | null, building?: string) {
  const { data: stages = [] } = useCourtCaseStatuses();
  const closedStageId = useMemo(
    () => stages.find((s) => /закры/i.test(s.name))?.id,
    [stages],
  );

  const query = useQuery<UnitsMatrixData>({
    queryKey: ['units-matrix', projectId, building, closedStageId],
    queryFn: async () => {
      if (!projectId) {
        return {
          units: [],
          floors: [] as Array<string | number>,
          unitsByFloor: {} as Record<string | number, Unit[]>,
          casesByUnit: {} as Record<string | number, Array<{ id: number }>>,
          lettersByUnit: {} as Record<string | number, boolean>,
          claimsByUnit: {} as Record<string | number, UnitClaimInfo>,
        };
      }

      let query = supabase
        .from('units')
        .select('id, name, building, floor, project_id, locked')
        .eq('project_id', projectId);
      if (building) query = query.eq('building', building);
      const { data: unitsData } = await query;
      const units = unitsData || [];

      const floors = Array.from(
        new Map(
          units
            .filter((u) => u.floor !== null && u.floor !== undefined && u.floor !== 0)
            .map((u) => [String(u.floor), u.floor]),
        ).values(),
      );
      floors.sort((a, b) => {
        if (!isNaN(a as any) && !isNaN(b as any)) return (b as any) - (a as any);
        if (!isNaN(a as any)) return -1;
        if (!isNaN(b as any)) return 1;
        return 0;
      });
      const unitsByFloor: Record<string | number, Unit[]> = {};
      units.forEach((u) => {
        if (!unitsByFloor[u.floor]) unitsByFloor[u.floor] = [];
        unitsByFloor[u.floor].push(u);
      });

      const casesByUnit: Record<string | number, Array<{ id: number }>> = {};
      const lettersByUnit: Record<string | number, boolean> = {};
      const claimsByUnit: Record<string | number, UnitClaimInfo> = {};

      if (units.length > 0) {
        const unitIds = units.map((u) => u.id);
        const { data: casesData } = await supabase
          .from('court_case_units')
          .select('unit_id, court_cases!inner(id,status,project_id)')
          .in('unit_id', unitIds)
          .eq('court_cases.project_id', projectId);
        (casesData || [])
          .map((row: any) => ({
            unit_id: row.unit_id,
            court_case: Array.isArray(row.court_cases) ? row.court_cases[0] : row.court_cases,
          }))
          .filter(
            (row) => row.court_case && (!closedStageId || row.court_case.status !== closedStageId),
          )
          .forEach((row) => {
            const uid = row.unit_id;
            const c = row.court_case;
            if (!casesByUnit[uid]) casesByUnit[uid] = [];
            casesByUnit[uid].push({ id: c.id });
          });

        const { data: letterRows } = await supabase
          .from('letter_units')
          .select('unit_id, letters!inner(id, project_id)')
          .in('unit_id', unitIds)
          .eq('letters.project_id', projectId);
        (letterRows || []).forEach((row) => {
          lettersByUnit[row.unit_id] = true;
        });

        const { data: claimRows } = await supabase
          .from('claim_units')
          .select(
            'unit_id, claims!inner(id, project_id, pre_trial_claim, claim_status_id, statuses(color))',
          )
          .in('unit_id', unitIds)
          .eq('claims.project_id', projectId);
        (claimRows || []).forEach((row: any) => {
          const cl = Array.isArray(row.claims) ? row.claims[0] : row.claims;
          if (!cl) return;
          if (!claimsByUnit[row.unit_id]) {
            claimsByUnit[row.unit_id] = {
              color: cl.statuses?.color ?? null,
              hasPretrialClaim: cl.pre_trial_claim ?? false,
            };
          } else if (cl.pre_trial_claim) {
            claimsByUnit[row.unit_id].hasPretrialClaim = true;
          }
        });
      }

      return { units, floors, unitsByFloor, casesByUnit, lettersByUnit, claimsByUnit };
    },
    staleTime: 5 * 60_000,
  });

  const handleAddUnit = async (floor: string | number) => {
    const userId = useAuthStore.getState().profile?.id ?? null;
    const unitsByFloorMap = query.data?.unitsByFloor || {};
    const floorsArr = query.data?.floors || [];
    let maxNum = 0;
    if (unitsByFloorMap[floor] && unitsByFloorMap[floor].length > 0) {
      const nums = unitsByFloorMap[floor].map((u) => Number(u.name)).filter((v) => !isNaN(v));
      if (nums.length > 0) maxNum = Math.max(...nums);
    } else {
      const idx = floorsArr.indexOf(floor);
      const belowFloor = idx < floorsArr.length - 1 ? floorsArr[idx + 1] : null;
      if (belowFloor && unitsByFloorMap[belowFloor] && unitsByFloorMap[belowFloor].length > 0) {
        const nums = unitsByFloorMap[belowFloor]
          .map((u) => Number(u.name))
          .filter((v) => !isNaN(v));
        if (nums.length > 0) maxNum = Math.max(...nums);
      }
    }
    const newName = String(maxNum + 1);
    const payload = {
      project_id: projectId,
      building: building || null,
      floor,
      name: newName,
      person_id: userId,
    };
    const { error } = await supabase.from('units').insert([payload]);
    if (!error) {
      await query.refetch();
    }
  };

  const handleAddFloor = async () => {
    const floorsArr = query.data?.floors || [];
    const numericFloors = floorsArr
      .filter((f) => !isNaN(f as any))
      .map((f) => Number(f));
    const candidate = numericFloors.length === 0 ? 1 : Math.max(...numericFloors) + 1;
    await handleAddUnit(candidate);
  };

  return {
    floors: query.data?.floors || [],
    unitsByFloor: query.data?.unitsByFloor || {},
    handleAddUnit,
    handleAddFloor,
    units: query.data?.units || [],
    fetchUnits: query.refetch,
    casesByUnit: query.data?.casesByUnit || {},
    lettersByUnit: query.data?.lettersByUnit || {},
    claimsByUnit: query.data?.claimsByUnit || {},
  };
}
