import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useClaims,
  useClaimsAllSummary,
  useClaimsStats,
  useClaimsAllStats,
  useClaimsAllLegacy,
} from '@/entities/claim';
import { useUsers } from '@/entities/user';
import { useUnitsByIds, useUnitsWithClaimsByProject, useAllUnitsWithClaims } from '@/entities/unit';
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

interface SortState {
  field: string | null;
  order: 'ascend' | 'descend' | null;
}

export function useClaimsDataPaginated(filters: ClaimFilters, perm: RolePermission | undefined) {
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 100,
    total: 0,
    hasMore: false,
  });
  
  // Sorting state
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    order: null,
  });

  // Reset page to 0 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 0 }));
  }, [filters]);

  // Check if there are active filters or sorting
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key];
      if (value === undefined || value === null || value === false) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      return true;
    });
  }, [filters]);
  
  // Need to load all data when sorting is active
  const hasSorting = sortState.field !== null && sortState.order !== null;
  const needsAllData = hasActiveFilters || hasSorting;

  // Data queries
  const claimsAssigned = useClaims(); // For assigned projects (non-paginated)
  
  // When filters or sorting are active, we need to load ALL data to process on client
  // When no filters/sorting, use normal pagination
  console.log(`[useClaimsDataPaginated] needsAllData: ${needsAllData} (filters: ${hasActiveFilters}, sorting: ${hasSorting}), page: ${pagination.page}, pageSize: ${needsAllData ? 10000 : pagination.pageSize}`);
  const claimsAllPaginated = useClaimsAllSummary(
    needsAllData ? 0 : pagination.page, 
    needsAllData ? 10000 : pagination.pageSize, // Load all data when filtering or sorting
    {} // Always pass empty filters, apply filtering on client side
  );
  
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

  // Update pagination state when server data changes
  useMemo(() => {
    if (usesPagination && claimsAllPaginated.data) {
      // When filtering or sorting, don't update total from server as we need to use filtered/sorted total
      if (!needsAllData) {
        setPagination(prev => ({
          ...prev,
          total: claimsAllPaginated.data.count,
          hasMore: claimsAllPaginated.data.hasMore,
        }));
      }
    }
  }, [usesPagination, claimsAllPaginated.data, needsAllData]);

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

  // Выбранные проекты
  const selectedProjectIds = useMemo(() => {
    if (!filters.project) return [];
    if (Array.isArray(filters.project)) {
      return projects
        .filter(pr => filters.project.includes(pr.name))
        .map(pr => pr.id);
    } else {
      const p = projects.find(pr => pr.name === filters.project);
      return p ? [p.id] : [];
    }
  }, [projects, filters.project]);

  // Все объекты с претензиями в проекте
  const selectedProjectId = selectedProjectIds.length === 1 ? selectedProjectIds[0] : null;
  const { data: projectUnits = [], isLoading: projectUnitsLoading } =
    useUnitsWithClaimsByProject(selectedProjectId);
  
  // Все объекты которые имеют претензии (для фильтров)
  const { data: allUnitsWithClaims = [], isLoading: allUnitsLoading } = useAllUnitsWithClaims();

  // Enhanced claims with computed fields and filtering
  const { allClaimsWithNames, filteredClaimsWithNames } = useMemo(() => {
    if (!claims) return { allClaimsWithNames: [], filteredClaimsWithNames: [] };
    
    console.log(`[useClaimsDataPaginated] Processing ${claims.length} claims`);
    console.log(`[useClaimsDataPaginated] Active filters:`, filters);

    const enhanced = claims.map((c) => {
      const buildings = Array.from(
        new Set(c.unit_ids.map((id) => buildingMap[id]).filter(Boolean)),
      );
      
      const unitNamesArray = c.unit_ids
        .map((id) => unitNumberMap[id])
        .filter(Boolean)
        .sort(naturalCompare);
      
      const unitNumbersArray = c.unit_ids
        .map((id) => unitMap[id])
        .filter(Boolean);

      // Debug log for first few items
      if (claims.indexOf(c) < 3) {
        console.log(`[useClaimsDataPaginated] Claim ${c.id} units:`, {
          unit_ids: c.unit_ids,
          unitNames: unitNamesArray,
          unitNumbers: unitNumbersArray,
          unitMap: Object.fromEntries(c.unit_ids.map(id => [id, unitMap[id]])),
          unitNumberMap: Object.fromEntries(c.unit_ids.map(id => [id, unitNumberMap[id]]))
        });
      }

      return {
        ...c,
        key: String(c.id),
        projectName: projectMap[c.project_id] || "—",
        buildings: buildings.join(", ") || "—",
        unitNames: unitNamesArray.join(", "),
        unitNumbers: unitNumbersArray.join(", "),
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

    if (hasActiveFilters) {
      const filtered = filterClaims(enhanced, filters);
      console.log(`[useClaimsDataPaginated] After filtering: ${filtered.length} claims remain from ${enhanced.length}`);
      return { allClaimsWithNames: enhanced, filteredClaimsWithNames: filtered };
    }
    console.log(`[useClaimsDataPaginated] No active filters, returning all ${enhanced.length} claims`);
    return { allClaimsWithNames: enhanced, filteredClaimsWithNames: enhanced };
  }, [
    claims,
    projectMap,
    buildingMap,
    unitNumberMap,
    userMap,
    statusMap,
    filters,
    hasActiveFilters,
  ]);

  // Сортировка данных
  const sortedClaimsWithNames = useMemo(() => {
    if (!sortState.field || !sortState.order) {
      return filteredClaimsWithNames;
    }
    
    const sorted = [...filteredClaimsWithNames].sort((a, b) => {
      let aVal: any = a[sortState.field as keyof typeof a];
      let bVal: any = b[sortState.field as keyof typeof b];
      
      // Special handling for court case column
      if (sortState.field === 'courtCase') {
        aVal = (a.caseUid || a.pre_trial_claim) ? 1 : 0;
        bVal = (b.caseUid || b.pre_trial_claim) ? 1 : 0;
      }
      
      // Handle null/undefined values
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';
      
      // Handle dayjs objects
      if (aVal && typeof aVal === 'object' && aVal.valueOf) {
        aVal = aVal.valueOf();
      }
      if (bVal && typeof bVal === 'object' && bVal.valueOf) {
        bVal = bVal.valueOf();
      }
      
      // Compare
      let result = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        result = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        result = aVal - bVal;
      } else {
        result = String(aVal).localeCompare(String(bVal));
      }
      
      return sortState.order === 'ascend' ? result : -result;
    });
    
    return sorted;
  }, [filteredClaimsWithNames, sortState]);

  // Клиентская пагинация для отфильтрованных и отсортированных данных
  const claimsWithNames = useMemo(() => {
    // Применяем клиентскую пагинацию когда есть фильтры/сортировка или для не-пагинированных данных
    if ((usesPagination && needsAllData) || !usesPagination) {
      if (sortedClaimsWithNames.length > pagination.pageSize) {
        const startIndex = pagination.page * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginated = sortedClaimsWithNames.slice(startIndex, endIndex);
        return paginated;
      }
    }
    
    return sortedClaimsWithNames;
  }, [sortedClaimsWithNames, usesPagination, needsAllData, pagination.page, pagination.pageSize]);

  // Update pagination state based on filtered data
  useEffect(() => {
    if (usesPagination) {
      if (needsAllData) {
        // For client-side filtering/sorting: use sorted data total
        const filteredTotal = sortedClaimsWithNames.length;
        const maxPage = Math.max(0, Math.ceil(filteredTotal / pagination.pageSize) - 1);
        
        setPagination(prev => {
          const newPage = Math.min(prev.page, maxPage);
          return {
            ...prev,
            page: newPage,
            total: filteredTotal,
            hasMore: filteredTotal > (newPage + 1) * pagination.pageSize,
          };
        });
      } else if (claimsAllPaginated.data) {
        // For server pagination: use server total (already handled in useMemo above)
        const serverTotal = claimsAllPaginated.data.count;
        const maxPage = Math.max(0, Math.ceil(serverTotal / pagination.pageSize) - 1);
        
        if (pagination.page > maxPage) {
          setPagination(prev => ({
            ...prev,
            page: maxPage,
          }));
        }
      }
    } else {
      // For non-paginated (assigned projects): use sorted data total
      const filteredTotal = sortedClaimsWithNames.length;
      const maxPage = Math.max(0, Math.ceil(filteredTotal / pagination.pageSize) - 1);
      
      setPagination(prev => {
        const newPage = Math.min(prev.page, maxPage);
        return {
          ...prev,
          page: newPage,
          total: filteredTotal,
          hasMore: filteredTotal > (newPage + 1) * pagination.pageSize,
        };
      });
    }
  }, [sortedClaimsWithNames.length, pagination.pageSize, usesPagination, claimsAllPaginated.data, needsAllData]);

  // Get statistics from server
  const statsQuery = usesPagination ? useClaimsAllStats() : useClaimsStats();
  
  // Statistics
  const totalClaims = statsQuery.data?.total || 0;
  const closedClaims = statsQuery.data?.closed || 0;
  const openClaims = statsQuery.data?.open || 0;
  const readyToExport = sortedClaimsWithNames.length; // Количество отфильтрованных для экспорта

  // Filter options for the filter component
  const filterOptions = useMemo(() => {
    const allClaims = allClaimsWithNames; // Используем все данные для опций фильтров

    const uniq = (values: (string | number | undefined | null)[]) =>
      Array.from(new Set(values.filter(Boolean) as (string | number)[])).sort(
        naturalCompare,
      );
    const mapOptions = (vals: (string | number | undefined | null)[]) =>
      uniq(vals).map((v) => ({ label: String(v), value: v }));

    // Для объектов используем полный список всех объектов с претензиями
    const unitsOpts = allUnitsWithClaims.map(u => u.name);
    
    // Добавим логирование только при первом вызове
    if (allUnitsWithClaims.length > 0 && allClaims.length > 0 && allClaims.indexOf(allClaims[0]) === 0) {
      console.log('[filterOptions] All units available:', unitsOpts.length, 'units');
      console.log('[filterOptions] Sample units:', unitsOpts.slice(0, 10));
    }

    // Для корпусов используем данные из всех объектов с претензиями
    const buildingsOpts = Array.from(new Set(allUnitsWithClaims.map(u => u.building).filter(Boolean)));

    const projectOptions = projects.map((p) => ({ label: p.name, value: p.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
    
    const unitOptions = mapOptions(unitsOpts);
    
    return {
      projects: projectOptions,
      units: unitOptions,
      buildings: mapOptions(buildingsOpts),
      statuses: mapOptions(allClaims.map((c) => c.statusName)),
      responsibleEngineers: mapOptions(
        allClaims.map((c) => c.responsibleEngineerName),
      ),
      ids: mapOptions(allClaims.map((c) => c.id)),
      authors: mapOptions(allClaims.map((c) => c.createdByName)),
    };
  }, [allClaimsWithNames, projects, allUnitsWithClaims]);

  // Pagination handlers
  const goToPage = useCallback((page: number) => {
    // Use current pagination total (which is set correctly based on filtering state)
    const totalForPagination = pagination.total;
    const maxPage = Math.max(0, Math.ceil(totalForPagination / pagination.pageSize) - 1);
    const safePage = Math.min(page, maxPage);
    
    setPagination(prev => ({ ...prev, page: safePage }));
  }, [pagination.total, pagination.pageSize]);

  const nextPage = useCallback(() => {
    const totalForPagination = pagination.total;
    const maxPage = Math.max(0, Math.ceil(totalForPagination / pagination.pageSize) - 1);
    if (pagination.page >= maxPage) return;
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  }, [pagination.total, pagination.pageSize, pagination.page]);

  const prevPage = useCallback(() => {
    if (pagination.page === 0) return;
    setPagination(prev => ({ ...prev, page: prev.page - 1 }));
  }, [pagination.page]);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 0 }));
  }, []);
  
  // Handle sorting changes
  const handleTableChange = useCallback((paginationInfo: any, filters: any, sorter: any) => {
    // Update sort state based on table changes
    if (sorter) {
      const field = sorter.field || sorter.columnKey || sorter.dataIndex;
      const order = sorter.order;
      
      setSortState({
        field: order ? field : null,
        order: order || null,
      });
      
      // Reset to first page when sorting changes
      setPagination(prev => ({ ...prev, page: 0 }));
    }
  }, []);

  const filtersLoading = allUnitsLoading; // Загрузка полного списка объектов

  return {
    claims,
    isLoading,
    error,
    claimsWithNames,
    filterOptions,
    filtersLoading,
    totalClaims,
    closedClaims,
    openClaims,
    readyToExport,
    
    // Pagination
    pagination: {
      ...pagination,
      usesPagination: true, // Всегда показываем пагинацию для единообразия интерфейса
      totalPages: Math.ceil(pagination.total / pagination.pageSize), // Use server total for pagination
      currentItems: claimsWithNames.length,
      totalFilteredItems: filteredClaimsWithNames.length,
    } as any,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    handleTableChange,
    sortState,
  };
}