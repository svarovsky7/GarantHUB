import { useMemo } from 'react';
import { useDefects, useDefectFileCounts } from '@/entities/defect';
import { useUnitsByIds, useLockedUnitIds } from '@/entities/unit';
import { useVisibleProjects } from '@/entities/project';
import { useBrigades } from '@/entities/brigade';
import { useContractors } from '@/entities/contractor';
import { useRolePermission } from '@/entities/rolePermission';
import {
  useClaimsSimple,
  useClaimsSimpleAll,
  useClaimIdsByDefectIds,
} from '@/entities/claim';
import { useAuthStore } from '@/shared/store/authStore';
import { useUsers } from '@/entities/user';
import type { RoleName } from '@/shared/types/rolePermission';
import type { DefectWithInfo } from '@/shared/types/defect';
import formatUnitName from '@/shared/utils/formatUnitName';
import { calculateDays } from '../lib/defectsHelpers';

/**
 * Хук для загрузки и трансформации данных страницы дефектов
 */
export function useDefectsData() {
  const { data: defects = [], isPending, isError, error } = useDefects();
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const { data: claimsAll = [] } = useClaimsSimpleAll();
  const { data: claimsAssigned = [] } = useClaimsSimple();
  const claims = perm?.only_assigned_project ? claimsAssigned : claimsAll;

  // Получаем unit IDs из дефектов и претензий
  const defectUnitIds = useMemo(
    () => defects.map((d) => d.unit_id).filter(Boolean) as number[],
    [defects],
  );
  const unitIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...claims.flatMap((t) => t.unit_ids || []),
          ...defectUnitIds,
        ]),
      ),
    [claims, defectUnitIds],
  );

  const { data: units = [] } = useUnitsByIds(unitIds);
  const { data: lockedUnitIds = [] } = useLockedUnitIds();
  const { data: projects = [] } = useVisibleProjects();
  const { data: brigades = [] } = useBrigades();
  const { data: contractors = [] } = useContractors();
  const { data: users = [] } = useUsers();

  const defectIds = useMemo(() => defects.map((d) => d.id), [defects]);
  const { data: claimIdMap = {} } = useClaimIdsByDefectIds(defectIds);
  const { data: fileCountsMap = {} } = useDefectFileCounts(defectIds);

  const userProjectIds = useAuthStore((s) => s.profile?.project_ids) ?? [];

  // Мемоизированные мапы для производительности
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      map.set(u.id, u.name);
    });
    return map;
  }, [users]);

  const unitMap = useMemo(
    () => new Map(units.map((u) => [u.id, formatUnitName(u, false)])),
    [units]
  );

  const buildingMap = useMemo(
    () => new Map(units.map((u) => [u.id, u.building || ''])),
    [units]
  );

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects]
  );

  const brigadeMap = useMemo(
    () => new Map(brigades.map((b) => [b.id, b.name])),
    [brigades]
  );

  const contractorMap = useMemo(
    () => new Map(contractors.map((c) => [c.id, c.name])),
    [contractors]
  );

  // Оптимизированная карта претензий
  const claimsMap = useMemo(() => {
    const map = new Map<
      number,
      { id: number; unit_ids: number[]; project_id: number; pre_trial_claim: boolean }[]
    >();
    claims.forEach((c: any) => {
      (c.claim_defects || []).forEach((cd: any) => {
        const arr = map.get(cd.defect_id) || [];
        arr.push({
          id: c.id,
          unit_ids: c.unit_ids || [],
          project_id: c.project_id,
          pre_trial_claim: cd.pre_trial_claim ?? false,
        });
        map.set(cd.defect_id, arr);
      });
    });
    return map;
  }, [claims]);

  // Обогащенные дефекты с дополнительной информацией
  const data: DefectWithInfo[] = useMemo(() => {
    if (isPending || !defects.length) return [];
    return defects.map((d: any) => {
      const claimLinked = claimsMap.get(d.id) || [];
      const hasPretrial = claimLinked.some((l) => l.pre_trial_claim);
      const unitIdsFromClaims = Array.from(new Set(claimLinked.flatMap((l) => l.unit_ids)));
      const unitIds = unitIdsFromClaims.length
        ? unitIdsFromClaims
        : d.unit_id != null
        ? [d.unit_id]
        : [];
      const unitNamesList = unitIds
        .map((id) => unitMap.get(id))
        .filter(Boolean);
      const unitNames = unitNamesList.join(', ');
      const buildingNamesList = Array.from(
        new Set(unitIds.map((id) => buildingMap.get(id)).filter(Boolean)),
      );
      const buildingNames = buildingNamesList.join(', ');
      const projectIdsFromClaims = Array.from(new Set(claimLinked.map((l) => l.project_id)));
      const projectIds = projectIdsFromClaims.length
        ? projectIdsFromClaims
        : d.project_id != null
        ? [d.project_id]
        : [];
      const projectNames = projectIds
        .map((id) => projectMap.get(id))
        .filter(Boolean)
        .join(', ');
      let fixByName = '—';
      if (d.brigade_id) {
        fixByName = brigadeMap.get(d.brigade_id) || 'Бригада';
      } else if (d.contractor_id) {
        fixByName = contractorMap.get(d.contractor_id) || 'Подрядчик';
      }
      return {
        ...d,
        claimIds: Array.from(
          new Set([
            ...claimLinked.map((l) => l.id),
            ...(claimIdMap[d.id] ?? []),
          ]),
        ),
        hasPretrialClaim: hasPretrial,
        createdByName: userMap.get(d.created_by as string) ?? null,
        engineerName: userMap.get(d.engineer_id as string) ?? null,
        unitIds,
        unitNames,
        unitNamesList,
        buildingNamesList,
        buildingNames,
        projectIds,
        projectNames,
        fixByName,
        days: calculateDays(d.received_at, d.fixed_at),
        defectTypeName: d.defect_type?.name ?? '',
        defectStatusName: d.defect_status?.name ?? '',
        defectStatusColor: d.defect_status?.color ?? null,
        filesCount: fileCountsMap[d.id] ?? 0,
      } as DefectWithInfo;
    });
  }, [defects, claimsMap, unitMap, buildingMap, projectMap, brigadeMap, contractorMap, userMap, claimIdMap, fileCountsMap, isPending]);

  // Фильтрация по назначенным проектам
  const filteredData = useMemo(() => {
    if (perm?.only_assigned_project) {
      return data.filter((d) =>
        (d.projectIds || []).some((id) => userProjectIds.includes(id)),
      );
    }
    return data;
  }, [data, perm?.only_assigned_project, userProjectIds]);

  return {
    defects: filteredData,
    isLoading: isPending,
    isError,
    error,
    lockedUnitIds,
    units,
    projects,
  };
}
