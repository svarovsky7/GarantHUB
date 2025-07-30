import { ClaimFilters } from "@/shared/types/claimFilters";
import { Dayjs } from "dayjs";

export function filterClaims<
  T extends {
    id: number;
    project_id?: number;
    unit_ids?: number[];
    projectName?: string;
    unitNames?: string;
    unitNumbers?: string;
    buildings?: string;
    statusName?: string;
    responsibleEngineerName?: string | null;
    createdByName?: string | null;
    claim_no?: string;
    registeredOn?: Dayjs | null;
    claimedOn?: Dayjs | null;
    acceptedOn?: Dayjs | null;
    resolvedOn?: Dayjs | null;
    description?: string;
  },
>(rows: T[], f: ClaimFilters): T[] {
  
  return rows.filter((r) => {
    if (f.id && f.id.length > 0 && !f.id.includes(r.id)) return false;
    if (f.project) {
      if (Array.isArray(f.project)) {
        if (f.project.length > 0) {
          // Сравниваем по именам проектов, так как фильтр передает имена
          const hasMatch = f.project.includes(r.projectName || '');
          if (!hasMatch) {
            return false;
          }
        }
      } else {
        // Для одиночного значения сравниваем по имени
        if (r.projectName !== f.project) {
          return false;
        }
      }
    }
    
    if (f.units && f.units.length > 0) {
      if (r.unitNumbers) {
        // Сравниваем по именам объектов (unitNumbers содержит строку с именами через запятую)
        const claimUnits = r.unitNumbers.split(",").map(u => u.trim());
        const hasMatch = f.units.some(filterUnit => claimUnits.includes(filterUnit));
        
        if (!hasMatch) {
          return false;
        }
      } else {
        return false;
      }
    }
    if (f.building) {
      if (Array.isArray(f.building)) {
        if (f.building.length > 0 && r.buildings) {
          const buildings = r.buildings.split(",").map((b) => b.trim());
          const ok = f.building.some((b) => buildings.includes(b));
          if (!ok) return false;
        }
      } else {
        if (r.buildings) {
          const buildings = r.buildings.split(",").map((b) => b.trim());
          if (!buildings.includes(f.building)) return false;
        }
      }
    }
    if (f.status && r.statusName !== f.status) return false;
    if (f.responsible && r.responsibleEngineerName !== f.responsible)
      return false;
    if (f.author && r.createdByName !== f.author) return false;
    if (f.claim_no && (!r.claim_no || !r.claim_no.includes(f.claim_no)))
      return false;
    if (
      f.description &&
      (!r.description || !r.description.includes(f.description))
    )
      return false;
    if (f.hideClosed && /(закры|не\s*гаран)/i.test(r.statusName || ""))
      return false;
    if (f.period && f.period.length === 2) {
      const [from, to] = f.period;
      if (!r.registeredOn) return false;
      if (
        r.registeredOn.isBefore(from, "day") ||
        r.registeredOn.isAfter(to, "day")
      )
        return false;
    }
    if (f.claimedPeriod && f.claimedPeriod.length === 2) {
      const [from, to] = f.claimedPeriod;
      if (!r.claimedOn) return false;
      if (r.claimedOn.isBefore(from, "day") || r.claimedOn.isAfter(to, "day"))
        return false;
    }
    if (f.acceptedPeriod && f.acceptedPeriod.length === 2) {
      const [from, to] = f.acceptedPeriod;
      if (!r.acceptedOn) return false;
      if (r.acceptedOn.isBefore(from, "day") || r.acceptedOn.isAfter(to, "day"))
        return false;
    }
    if (f.resolvedPeriod && f.resolvedPeriod.length === 2) {
      const [from, to] = f.resolvedPeriod;
      if (!r.resolvedOn) return false;
      if (r.resolvedOn.isBefore(from, "day") || r.resolvedOn.isAfter(to, "day"))
        return false;
    }
    return true;
  });
}
