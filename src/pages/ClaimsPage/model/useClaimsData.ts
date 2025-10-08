import { useMemo } from 'react';
import {
  useClaims,
  useClaimsAllLegacy,
} from '@/entities/claim';
import { useUsers } from '@/entities/user';
import { useUnitsByIds, useLockedUnitIds } from '@/entities/unit';
import { useRolePermission } from '@/entities/rolePermission';
import { useAuthStore } from '@/shared/store/authStore';
import { useVisibleProjects } from '@/entities/project';
import type { RoleName } from '@/shared/types/rolePermission';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import formatUnitShortName from '@/shared/utils/formatUnitShortName';

/**
 * Хук для загрузки и трансформации данных страницы претензий
 */
export function useClaimsData() {
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);

  // Оптимизированная загрузка данных
  const {
    data: claimsAssigned = [],
    isLoading: loadingAssigned,
    error: errorAssigned,
  } = useClaims();
  const {
    data: claimsAll = [],
    isLoading: loadingAll,
    error: errorAll,
  } = useClaimsAllLegacy();

  const claims = perm?.only_assigned_project ? claimsAssigned : claimsAll;
  const isLoading = perm?.only_assigned_project ? loadingAssigned : loadingAll;
  const error = errorAssigned || errorAll;

  // Ленивая загрузка пользователей и юнитов
  const { data: users = [], isPending: usersLoading } = useUsers();
  const { data: lockedUnitIds = [] } = useLockedUnitIds();
  const { data: projects = [] } = useVisibleProjects();

  // Получаем только нужные unit IDs
  const unitIds = useMemo(
    () => Array.from(new Set(claims.flatMap((t) => (t.unit_ids || []) as number[]))),
    [claims],
  );
  const { data: units = [], isPending: unitsLoading } = useUnitsByIds(unitIds);

  // Мемоизированные мапы для производительности
  const userMap = useMemo(() => {
    const map = {} as Record<string, string>;
    users.forEach((u) => {
      map[u.id] = u.name;
    });
    return map;
  }, [users]);

  const unitMap = useMemo(() => {
    const map = {} as Record<number, string>;
    units.forEach((u) => {
      map[u.id] = formatUnitShortName(u);
    });
    return map;
  }, [units]);

  const unitNumberMap = useMemo(() => {
    const map = {} as Record<number, string>;
    units.forEach((u) => {
      map[u.id] = u.name;
    });
    return map;
  }, [units]);

  const buildingMap = useMemo(() => {
    const map = {} as Record<number, string>;
    units.forEach((u) => {
      if (u.building) map[u.id] = u.building;
    });
    return map;
  }, [units]);

  // Мемоизированные претензии с именами
  const claimsWithNames: ClaimWithNames[] = useMemo(
    () =>
      claims.map((c) => ({
        ...c,
        unitNames: c.unit_ids
          .map((id) => unitMap[id])
          .filter(Boolean)
          .join(', '),
        unitNumbers: c.unit_ids
          .map((id) => unitNumberMap[id])
          .filter(Boolean)
          .join(', '),
        buildings: Array.from(
          new Set(c.unit_ids.map((id) => buildingMap[id]).filter(Boolean)),
        ).join(', '),
        responsibleEngineerName: userMap[c.engineer_id] ?? null,
        createdByName: userMap[c.created_by as string] ?? null,
      })),
    [claims, unitMap, unitNumberMap, buildingMap, userMap],
  );

  // Опции для фильтров
  const filterOptions = useMemo(() => {
    const uniqueProjects = Array.from(new Set(projects.map(p => ({ value: p.name, label: p.name }))))
      .sort((a, b) => a.label.localeCompare(b.label));

    const uniqueUnits = Array.from(new Set(units.map(u => ({ value: formatUnitShortName(u), label: formatUnitShortName(u) }))))
      .sort((a, b) => a.label.localeCompare(b.label));

    const uniqueBuildings = Array.from(
      new Set(claimsWithNames.map(c => c.buildings).filter(Boolean))
    ).map(building => ({ value: building, label: building }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const uniqueStatuses = Array.from(
      new Set(claimsWithNames.map(c => ({ id: c.claim_status_id, name: c.statusName })).filter(s => s.name))
    ).map(s => ({ value: s.name, label: s.name }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const uniqueEngineers = Array.from(
      new Set(claimsWithNames.map(c => c.responsibleEngineerName).filter(Boolean))
    ).map(name => ({ value: name, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const uniqueAuthors = Array.from(
      new Set(claimsWithNames.map(c => c.createdByName).filter(Boolean))
    ).map(name => ({ value: name, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const uniqueIds = claimsWithNames.map(c => ({ value: c.id, label: c.id.toString() }))
      .sort((a, b) => b.value - a.value);

    return {
      projects: uniqueProjects,
      units: uniqueUnits,
      buildings: uniqueBuildings,
      statuses: uniqueStatuses,
      responsibleEngineers: uniqueEngineers,
      authors: uniqueAuthors,
      ids: uniqueIds,
    };
  }, [projects, units, claimsWithNames]);

  return {
    claims: claimsWithNames,
    isLoading: isLoading || usersLoading || unitsLoading,
    error,
    lockedUnitIds,
    filterOptions,
  };
}
