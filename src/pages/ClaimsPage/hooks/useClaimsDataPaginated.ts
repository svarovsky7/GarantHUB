import { useState, useMemo, useCallback } from 'react';
import {
  useClaims,
  useClaimsAllSummary,
  useClaimsStats,
  useClaimsAllStats,
  useClaimsAllLegacy,
} from '@/entities/claim';
import { useUsers } from '@/entities/user';
import { useUnitsByIds } from '@/entities/unit';
import { useVisibleProjects } from '@/entities/project';
import { useClaimStatuses } from '@/entities/claimStatus';
import formatUnitShortName from '@/shared/utils/formatUnitShortName';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import { filterClaims } from '@/shared/utils/claimFilter';
import { naturalCompare } from '@/shared/utils/naturalSort';
import type { ClaimFilters } from '@/shared/types/claimFilters';
import type { RolePermission } from '@/shared/types/rolePermission';
import dayjs from 'dayjs';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export function useClaimsDataPaginated(filters: ClaimFilters, perm: RolePermission | undefined) {
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 100,
    total: 0,
    hasMore: false,
  });

  // Data queries
  const claimsAssigned = useClaims(); // For assigned projects (non-paginated)
  const claimsAllPaginated = useClaimsAllSummary(pagination.page, pagination.pageSize); // For all projects (paginated)
  
  // Choose between assigned or all claims based on permissions
  const usesPagination = !perm?.only_assigned_project;
  const claims = usesPagination 
    ? claimsAllPaginated.data?.data 
    : claimsAssigned.data;
  
  const isLoading = usesPagination 
    ? claimsAllPaginated.isLoading 
    : claimsAssigned.isLoading;
  
  const error = usesPagination 
    ? claimsAllPaginated.error 
    : claimsAssigned.error;

  // Update pagination state when data changes
  useMemo(() => {
    if (usesPagination && claimsAllPaginated.data) {
      setPagination(prev => ({
        ...prev,
        total: claimsAllPaginated.data.count,
        hasMore: claimsAllPaginated.data.hasMore,
      }));
    }
  }, [usesPagination, claimsAllPaginated.data]);

  const { data: users = [] } = useUsers();
  const { data: projects = [] } = useVisibleProjects();
  const { data: statuses = [] } = useClaimStatuses();

  // Get unit IDs from claims
  const unitIds = useMemo(
    () => Array.from(new Set((claims ?? []).flatMap((c) => c.unit_ids))),
    [claims],
  );
  const { data: units = [] } = useUnitsByIds(unitIds);

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
    units.forEach((u) => (map[u.id] = u.name));
    return map;
  }, [units]);

  const unitNumberMap = useMemo(() => {
    const map = {} as Record<number, string>;
    units.forEach((u) => (map[u.id] = formatUnitShortName({ name: u.name, floor: u.floor })));
    return map;
  }, [units]);

  const buildingMap = useMemo(() => {
    const map = {} as Record<number, string>;
    units.forEach((u) => {
      if (u.building) map[u.id] = u.building;
    });
    return map;
  }, [units]);

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
        unitNumbers: c.unit_ids
          .map((id) => unitMap[id])
          .filter(Boolean)
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

  // Get statistics from server
  const statsQuery = usesPagination ? useClaimsAllStats() : useClaimsStats();
  
  // Statistics
  const totalClaims = statsQuery.data?.total || 0;
  const closedClaims = statsQuery.data?.closed || 0;
  const openClaims = statsQuery.data?.open || 0;
  const readyToExport = filteredClaims.length;

  // Filter options for the filter component
  const filterOptions = useMemo(() => {
    const without = <K extends keyof ClaimFilters>(key: K) => {
      const { [key]: _omit, ...rest } = filters;
      return rest as ClaimFilters;
    };
    const filtered = <K extends keyof ClaimFilters>(key: K) =>
      filterClaims(claimsWithNames, without(key));

    const uniq = (values: (string | number | undefined | null)[]) =>
      Array.from(new Set(values.filter(Boolean) as (string | number)[])).sort(
        naturalCompare,
      );
    const mapOptions = (vals: (string | number | undefined | null)[]) =>
      uniq(vals).map((v) => ({ label: String(v), value: v }));

    const projectFiltered = filters.project
      ? filterClaims(claimsWithNames, { project: filters.project })
      : claimsWithNames;

    return {
      projects: mapOptions(projects.map((p) => p.name)),
      units: mapOptions(
        projectFiltered.flatMap((c) =>
          c.unitNumbers ? c.unitNumbers.split(",").map((n) => n.trim()) : [],
        ),
      ),
      buildings: mapOptions(
        projectFiltered.flatMap((c) =>
          c.buildings ? c.buildings.split(",").map((n) => n.trim()) : [],
        ),
      ),
      statuses: mapOptions(filtered("status").map((c) => c.statusName)),
      responsibleEngineers: mapOptions(
        filtered("responsible").map((c) => c.responsibleEngineerName),
      ),
      ids: mapOptions(filtered("id").map((c) => c.id)),
      authors: mapOptions(filtered("author").map((c) => c.createdByName)),
    };
  }, [claimsWithNames, filters, projects]);

  // Pagination handlers
  const goToPage = useCallback((page: number) => {
    if (!usesPagination) return;
    setPagination(prev => ({ ...prev, page }));
  }, [usesPagination]);

  const nextPage = useCallback(() => {
    if (!usesPagination || !pagination.hasMore) return;
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  }, [usesPagination, pagination.hasMore]);

  const prevPage = useCallback(() => {
    if (!usesPagination || pagination.page === 0) return;
    setPagination(prev => ({ ...prev, page: prev.page - 1 }));
  }, [usesPagination, pagination.page]);

  const setPageSize = useCallback((pageSize: number) => {
    if (!usesPagination) return;
    setPagination(prev => ({ ...prev, pageSize, page: 0 }));
  }, [usesPagination]);

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
    
    // Pagination
    pagination: {
      ...pagination,
      usesPagination,
    },
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
  };
}