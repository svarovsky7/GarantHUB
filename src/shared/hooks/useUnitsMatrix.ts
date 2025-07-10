import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/shared/store/authStore';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';
import { useOptimizedUnitsMatrix } from '@/shared/hooks/useOptimizedQueries';
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

  // Используем оптимизированную функцию для получения матрицы помещений
  const optimizedMatrix = useOptimizedUnitsMatrix(projectId!);

  const query = useQuery<UnitsMatrixData>({
    queryKey: ['units-matrix', projectId, building, closedStageId],
    enabled: !!projectId && !optimizedMatrix.data,
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

      // Fallback для случаев когда оптимизированная функция недоступна
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

      return { units, floors, unitsByFloor, casesByUnit: {}, lettersByUnit: {}, claimsByUnit: {} };
    },
    staleTime: 5 * 60_000,
  });

  // Обрабатываем данные из оптимизированной функции
  const processedData = useMemo(() => {
    if (!optimizedMatrix.data) {
      return query.data || {
        units: [],
        floors: [],
        unitsByFloor: {},
        casesByUnit: {},
        lettersByUnit: {},
        claimsByUnit: {},
      };
    }

    const units = optimizedMatrix.data.map(item => ({
      id: item.unit_id,
      name: item.unit_name,
      building: item.building,
      floor: item.floor,
      project_id: projectId!,
      locked: false, // TODO: добавить информацию о блокировке если нужно
    }));

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

    optimizedMatrix.data.forEach(item => {
      // Судебные дела
      if (item.court_cases_count > 0) {
        casesByUnit[item.unit_id] = [{ id: 1 }]; // Заглушка, так как нет конкретных ID
      }

      // Письма
      if (item.letters_count > 0) {
        lettersByUnit[item.unit_id] = true;
      }

      // Претензии
      if (item.claims_count > 0) {
        claimsByUnit[item.unit_id] = {
          color: null, // TODO: получить цвет статуса
          hasPretrialClaim: false, // TODO: получить информацию о досудебных претензиях
        };
      }
    });

    return { units, floors, unitsByFloor, casesByUnit, lettersByUnit, claimsByUnit };
  }, [optimizedMatrix.data, projectId]);

  const activeQuery = optimizedMatrix.data ? optimizedMatrix : query;

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
    floors: processedData.floors,
    unitsByFloor: processedData.unitsByFloor,
    handleAddUnit,
    handleAddFloor,
    units: processedData.units,
    fetchUnits: optimizedMatrix.data ? optimizedMatrix.refetch : query.refetch,
    casesByUnit: processedData.casesByUnit,
    lettersByUnit: processedData.lettersByUnit,
    claimsByUnit: processedData.claimsByUnit,
  };
}
