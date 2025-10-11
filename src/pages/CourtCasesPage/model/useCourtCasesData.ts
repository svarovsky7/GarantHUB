import { useMemo } from "react";
import dayjs from "dayjs";
import type { CourtCase } from "@/shared/types/courtCase";
import { useCourtCases } from "@/entities/courtCase";
import { useVisibleProjects } from "@/entities/project";
import { useUnitsByIds } from "@/entities/unit";
import { useUsers } from "@/entities/user";
import { useCourtCaseStatuses } from "@/entities/courtCaseStatus";
import { useCasePartiesByCaseIds } from "@/entities/courtCaseParty";

export type CourtCaseEnriched = CourtCase & {
  caseUid: string | null;
  plaintiffs: string;
  defendants: string;
  projectName: string;
  projectObject: string;
  buildingNamesList: string[];
  buildings: string;
  totalClaimAmount: number;
  responsibleLawyer: string | null;
  createdAt: dayjs.Dayjs | null;
  createdByName: string | null;
  daysSinceFixStart: number | null;
  statusName: string | null;
  statusColor: string | null;
};

/**
 * Hook for fetching and enriching court cases data
 * @returns Enriched court cases with related data (projects, units, users, statuses, parties)
 */
export function useCourtCasesData() {
  const { data: cases = [], isPending: casesLoading } = useCourtCases();
  const { data: projects = [] } = useVisibleProjects();
  const { data: users = [] } = useUsers();
  const { data: stages = [] } = useCourtCaseStatuses();

  // Get all unique unit IDs from cases
  const unitIds = useMemo(
    () =>
      Array.from(
        new Set(
          cases
            .flatMap((c) => c.unit_ids ?? [])
            .filter((id): id is number => Boolean(id))
        )
      ),
    [cases]
  );
  const { data: caseUnits = [] } = useUnitsByIds(unitIds);

  // Fetch parties for all cases
  const caseIds = useMemo(() => cases.map((c) => c.id), [cases]);
  const { data: parties = [], isLoading: partiesLoading } = useCasePartiesByCaseIds(caseIds);

  // Build building map
  const buildingMap = useMemo(() => {
    const map = new Map<number, string>();
    (caseUnits ?? []).forEach((u) => {
      if (u.building) map.set(u.id, u.building);
    });
    return map;
  }, [caseUnits]);

  // Build parties map
  const partiesMap = useMemo(() => {
    const map = new Map<number, { plaintiffs: string[]; defendants: string[] }>();

    (parties ?? []).forEach((p) => {
      const entry = map.get(p.case_id) || { plaintiffs: [], defendants: [] };
      const name = p.persons?.full_name ?? p.contractors?.name ?? "";

      // Check role with possible variants
      const roleStr = String(p.role || "").toLowerCase().trim();

      if (roleStr === "plaintiff" || roleStr === "истец") {
        if (name) {
          entry.plaintiffs.push(name);
        }
      } else if (roleStr === "defendant" || roleStr === "ответчик") {
        if (name) {
          entry.defendants.push(name);
        }
      }

      map.set(p.case_id, entry);
    });

    return map;
  }, [parties]);

  // Find closed stage ID
  const closedStageId = useMemo(() => {
    return stages.find((s) => s.name.toLowerCase().includes("закры"))?.id;
  }, [stages]);

  // Enrich cases with related data
  const casesData: CourtCaseEnriched[] = useMemo(() => {
    return cases.map((c: any) => {
      const partiesData = partiesMap.get(c.id);

      return {
        ...c,
        caseUid: c.caseUid,
        plaintiffs: (partiesData?.plaintiffs || []).join(", "),
        defendants: (partiesData?.defendants || []).join(", "),
        projectName: projects.find((p) => p.id === c.project_id)?.name ?? "",
        projectObject: (c.unit_ids ?? [])
          .map((id: number) => caseUnits.find((u) => u.id === id)?.name)
          .filter(Boolean)
          .join(", "),
        buildingNamesList: Array.from(
          new Set(
            (c.unit_ids ?? [])
              .map((id: number) => buildingMap.get(id))
              .filter(Boolean)
          )
        ) as string[],
        buildings: Array.from(
          new Set(
            (c.unit_ids ?? [])
              .map((id: number) => buildingMap.get(id))
              .filter(Boolean)
          )
        ).join(", "),
        totalClaimAmount: c.total_claim_amount || 0,
        responsibleLawyer:
          users.find((u) => u.id === c.responsible_lawyer_id)?.name ??
          c.responsibleLawyer,
        createdAt: c.created_at ? dayjs(c.created_at) : null,
        createdByName: users.find((u) => u.id === c.created_by)?.name ?? null,
        daysSinceFixStart: c.fix_start_date
          ? dayjs().diff(dayjs(c.fix_start_date), "day")
          : null,
        statusName: stages.find((s) => s.id === c.status)?.name ?? null,
        statusColor: stages.find((s) => s.id === c.status)?.color ?? null,
      };
    });
  }, [cases, projects, caseUnits, buildingMap, partiesMap, users, stages]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = cases.length;
    const closedCount = closedStageId
      ? cases.filter((c) => c.status === closedStageId).length
      : 0;
    const openCount = total - closedCount;

    return { total, closedCount, openCount };
  }, [cases, closedStageId]);

  return {
    cases: casesData,
    isLoading: casesLoading || partiesLoading,
    projects,
    units: caseUnits,
    users,
    stages,
    closedStageId,
    stats,
  };
}
