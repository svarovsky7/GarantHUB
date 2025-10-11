import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { CourtCasesFiltersValues } from "@/shared/types/courtCasesFilters";
import type { CourtCaseEnriched } from "./useCourtCasesData";
import { useCourtCasesFilterOptions } from "@/features/courtCase/model/useCourtCasesFilterOptions";
import type { Project } from "@/shared/types/project";
import type { Unit } from "@/shared/types/unit";
import type { CourtCaseStatus } from "@/shared/types/courtCaseStatus";
import type { User } from "@/shared/types/user";

const LS_KEY = "courtCasesHideClosed";
const LS_FILTERS_VISIBLE_KEY = "courtCasesFiltersVisible";

interface UseCourtCasesFiltersProps {
  cases: CourtCaseEnriched[];
  projects: Project[];
  units: Unit[];
  stages: CourtCaseStatus[];
  users: User[];
  closedStageId?: number;
}

/**
 * Hook for managing court cases filters state and visibility
 * @returns Filters state, handlers, and filter options
 */
export function useCourtCasesFilters({
  cases,
  projects,
  units,
  stages,
  users,
  closedStageId,
}: UseCourtCasesFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL params
  const initialValues = useMemo(() => ({
    project_id: searchParams.get("project_id")
      ? Number(searchParams.get("project_id")!)
      : undefined,
    unit_ids: searchParams.get("unit_id")
      ? [Number(searchParams.get("unit_id")!)]
      : undefined,
    responsible_lawyer_id: searchParams.get("responsible_lawyer_id") || undefined,
    status: searchParams.get("status")
      ? Number(searchParams.get("status")!)
      : undefined,
  }), [searchParams]);

  // Filters visibility state
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_FILTERS_VISIBLE_KEY);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Filters values state
  const [filters, setFilters] = useState<CourtCasesFiltersValues>(() => {
    let hideClosed = false;
    try {
      const saved = localStorage.getItem(LS_KEY);
      hideClosed = saved ? JSON.parse(saved) : false;
    } catch {}
    return {
      hideClosed,
      projectId: initialValues.project_id,
      objectId: initialValues.unit_ids ? initialValues.unit_ids[0] : undefined,
      building: undefined,
    } as CourtCasesFiltersValues;
  });

  // Sync filters with URL params
  useEffect(() => {
    const prj = searchParams.get("project_id");
    const obj = searchParams.get("unit_id");
    setFilters((f) => ({
      ...f,
      projectId: prj ? Number(prj) : f.projectId,
      objectId: obj ? Number(obj) : f.objectId,
    }));
  }, [searchParams]);

  // Sync with localStorage changes (cross-tab)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LS_KEY) {
        try {
          setFilters((f) => ({
            ...f,
            hideClosed: JSON.parse(e.newValue || "false"),
          }));
        } catch {}
      }
      if (e.key === LS_FILTERS_VISIBLE_KEY) {
        try {
          setShowFilters(JSON.parse(e.newValue || "true"));
        } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Persist filters visibility
  useEffect(() => {
    try {
      localStorage.setItem(LS_FILTERS_VISIBLE_KEY, JSON.stringify(showFilters));
    } catch {}
  }, [showFilters]);

  // Handle filters change
  const handleFiltersChange = (v: CourtCasesFiltersValues) => {
    if (v.hideClosed !== filters.hideClosed) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(v.hideClosed));
      } catch {}
    }
    setFilters(v);
  };

  // Reset filters
  const resetFilters = () =>
    setFilters((f) => ({ hideClosed: f.hideClosed }) as CourtCasesFiltersValues);

  // Get filter options and filtered data
  const {
    filteredCases,
    projectOptions,
    buildingOptions,
    unitOptions,
    statusOptions,
    userOptions,
    idOptions,
  } = useCourtCasesFilterOptions(
    cases,
    projects,
    units,
    stages,
    users,
    filters,
    closedStageId
  );

  return {
    filters,
    setFilters: handleFiltersChange,
    resetFilters,
    showFilters,
    setShowFilters,
    initialValues,
    filteredCases,
    filterOptions: {
      projects: projectOptions,
      buildings: buildingOptions,
      units: unitOptions,
      statuses: statusOptions,
      users: userOptions,
      ids: idOptions,
    },
  };
}
