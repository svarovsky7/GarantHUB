import { useMemo } from 'react';
import {
  useClaims,
  useClaimsAllLegacy as useClaimsAll,
} from '@/entities/claim';
import { useUsers } from '@/entities/user';
import { useUnits, useUnitsByIds } from '@/entities/unit';
import { useVisibleProjects } from '@/entities/project';
import { useClaimStatuses } from '@/entities/claimStatus';
import formatUnitShortName from '@/shared/utils/formatUnitShortName';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import { filterClaims } from '@/shared/utils/claimFilter';
import { naturalCompare } from '@/shared/utils/naturalSort';
import type { ClaimFilters } from '@/shared/types/claimFilters';
import type { RolePermission } from '@/shared/types/rolePermission';
import dayjs from 'dayjs';

export function useClaimsData(filters: ClaimFilters, perm: RolePermission | undefined) {
  // Data queries
  const claimsAssigned = useClaims();
  const claimsAll = useClaimsAll();
  const claims = perm?.only_assigned_project ? claimsAssigned.data : claimsAll.data;
  const isLoading = claimsAssigned.isLoading || claimsAll.isLoading;
  const error = claimsAssigned.error || claimsAll.error;

  const { data: users = [] } = useUsers();
  const { data: projects = [] } = useVisibleProjects();
  const { data: statuses = [] } = useClaimStatuses();

  // Get all units for filter options
  const { data: allUnits = [] } = useUnits();
  
  // Get unit IDs from claims for enriching claim data
  const unitIds = useMemo(
    () => Array.from(new Set((claims ?? []).flatMap((c) => c.unit_ids))),
    [claims],
  );
  const { data: claimUnits = [] } = useUnitsByIds(unitIds);

  // Memoized maps for performance
  const userMap = useMemo(() => {
    const map = {} as Record<string, string>;
    users.forEach((u) => (map[u.id] = u.name));
    return map;
  }, [users]);

  const projectMap = useMemo(() => {
    const map = {} as Record<number, string>;
    projects.forEach((p) => (map[p.id] = p.name));
    return map;
  }, [projects]);

  const unitMap = useMemo(() => {
    const map = {} as Record<number, string>;
    claimUnits.forEach((u) => (map[u.id] = u.name));
    return map;
  }, [claimUnits]);

  const unitNumberMap = useMemo(() => {
    const map = {} as Record<number, string>;
    claimUnits.forEach((u) => (map[u.id] = formatUnitShortName({ name: u.name, floor: u.floor })));
    return map;
  }, [claimUnits]);

  const buildingMap = useMemo(() => {
    const map = {} as Record<number, string>;
    claimUnits.forEach((u) => {
      if (u.building) map[u.id] = u.building;
    });
    return map;
  }, [claimUnits]);

  const statusMap = useMemo(() => {
    const map = {} as Record<number, { name: string; color: string }>;
    statuses.forEach((s) => (map[s.id] = { name: s.name, color: s.color }));
    return map;
  }, [statuses]);

  // Enhanced claims with computed fields
  const claimsWithNames: ClaimWithNames[] = useMemo(() => {
    if (!claims) return [];

    return claims.map((c) => {
      const buildings = Array.from(
        new Set(c.unit_ids.map((id) => buildingMap[id]).filter(Boolean)),
      );

      return {
        ...c,
        key: String(c.id),
        projectName: projectMap[c.project_id] || "—",
        buildings: buildings.join(", ") || "—",
        unitNames: c.unit_ids
          .map((id) => unitNumberMap[id])
          .filter(Boolean)
          .sort(naturalCompare)
          .join(", "),
        responsibleEngineerName: userMap[c.engineer_id || ""] || "—",
        createdByName: userMap[c.created_by || ""] || "—",
        statusName: statusMap[c.claim_status_id || 0]?.name || "—",
        statusColor: statusMap[c.claim_status_id || 0]?.color || "#ccc",
        claimedOn: c.claimed_on ? dayjs(c.claimed_on) : null,
        acceptedOn: c.accepted_on ? dayjs(c.accepted_on) : null,
        registeredOn: c.registered_on ? dayjs(c.registered_on) : null,
        resolvedOn: c.resolved_on ? dayjs(c.resolved_on) : null,
        createdAt: c.created_at ? dayjs(c.created_at) : null,
      };
    });
  }, [
    claims,
    projectMap,
    buildingMap,
    unitNumberMap,
    userMap,
    statusMap,
  ]);

  // Apply filters
  const filteredClaims = useMemo(() => {
    return filterClaims(claimsWithNames, filters);
  }, [claimsWithNames, filters]);

  // Statistics
  const closedStatusId = useMemo(
    () => statuses.find((s) => /закры/i.test(s.name))?.id ?? null,
    [statuses],
  );

  const totalClaims = claimsWithNames.length;
  const closedClaims = useMemo(
    () => claimsWithNames.filter((c) => 
      closedStatusId !== null && c.claim_status_id === closedStatusId
    ).length,
    [claimsWithNames, closedStatusId],
  );
  const openClaims = totalClaims - closedClaims;
  const readyToExport = filteredClaims.length;

  // Filter options for the filter component
  const filterOptions = useMemo(() => ({
    responsibleEngineers: users.map((u) => ({ value: u.id, label: u.name })),
    authors: users.map((u) => ({ value: u.id, label: u.name })),
    projects: projects.map((p) => ({ value: p.id, label: p.name })),
    statuses: statuses.map((s) => ({ value: s.id, label: s.name })),
    buildings: Array.from(
      new Set(allUnits.map((u) => u.building).filter(Boolean)),
    ).map((b) => ({ value: b, label: b })),
    units: allUnits.map((u) => ({ value: u.id, label: formatUnitShortName({ name: u.name, floor: u.floor }) })),
    ids: claims ? claims.map((c) => ({ value: c.id, label: `#${c.id}` })) : [],
  }), [users, projects, statuses, allUnits, claims]);

  const filtersLoading = false; // Можно добавить логику загрузки

  return {
    claims,
    isLoading,
    error,
    claimsWithNames: filteredClaims,
    filterOptions,
    filtersLoading,
    totalClaims,
    closedClaims,
    openClaims,
    readyToExport,
  };
}