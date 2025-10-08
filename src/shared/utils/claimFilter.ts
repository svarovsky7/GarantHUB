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
    caseUid?: string | null;
    pre_trial_claim?: boolean;
  },
>(rows: T[], f: ClaimFilters): T[] {
  const result = rows.filter((r) => {
    // Фильтр по ID претензии
    if (f.id && f.id.length > 0) {
      if (!f.id.includes(r.id)) {
        return false;
      }
    }
    
    // Фильтр по проекту
    if (f.project) {
      if (Array.isArray(f.project)) {
        if (f.project.length > 0 && r.projectName) {
          const hasMatch = f.project.includes(r.projectName);
          if (!hasMatch) {
            return false;
          }
        }
      } else {
        if (!r.projectName || r.projectName !== f.project) {
          return false;
        }
      }
    }
    
    // Фильтр по объектам  
    if (f.units && f.units.length > 0) {
      if (r.unitNumbers) {
        // unitNumbers содержит простые имена объектов через запятую (без форматирования)
        const claimUnits = r.unitNumbers.split(",").map(u => u.trim());
        const hasMatch = f.units.some(filterUnit => claimUnits.includes(filterUnit));
        
        // Debug logging for units filtering
        if (r.id === rows[0]?.id) { // Log only for first item to avoid spam
          console.log('[claimFilter] Units filter:', {
            filterUnits: f.units,
            claimUnits,
            unitNumbers: r.unitNumbers,
            hasMatch
          });
        }
        
        if (!hasMatch) {
          return false;
        }
      } else {
        return false;
      }
    }
    
    // Фильтр по корпусу
    if (f.building) {
      if (Array.isArray(f.building)) {
        if (f.building.length > 0) {
          if (!r.buildings) {
            return false;
          }
          const buildings = r.buildings.split(",").map((b) => b.trim());
          const ok = f.building.some((b) => buildings.includes(b));
          if (!ok) {
            return false;
          }
        }
      } else {
        if (!r.buildings) {
          return false;
        }
        const buildings = r.buildings.split(",").map((b) => b.trim());
        if (!buildings.includes(f.building)) {
          return false;
        }
      }
    }
    
    // Фильтр по статусу
    if (f.status && r.statusName !== f.status) {
      return false;
    }
    
    // Фильтр по закрепленному инженеру
    if (f.responsible && r.responsibleEngineerName !== f.responsible) {
      return false;
    }
    
    // Фильтр по автору
    if (f.author && r.createdByName !== f.author) {
      return false;
    }
    
    // Фильтр по номеру претензии (частичное совпадение)
    if (f.claim_no) {
      if (!r.claim_no || !r.claim_no.toLowerCase().includes(f.claim_no.toLowerCase())) {
        return false;
      }
    }
    
    // Фильтр по дополнительной информации (частичное совпадение)
    if (f.description) {
      if (!r.description || !r.description.toLowerCase().includes(f.description.toLowerCase())) {
        return false;
      }
    }
    
    // Фильтр "Скрыть закрытые"
    if (f.hideClosed && /(закры|не\s*гаран)/i.test(r.statusName || "")) {
      return false;
    }
    
    // Фильтр по дате регистрации
    if (f.period && f.period.length === 2) {
      const [from, to] = f.period;
      if (!r.registeredOn) {
        return false;
      }
      if (r.registeredOn.isBefore(from, "day") || r.registeredOn.isAfter(to, "day")) {
        return false;
      }
    }
    
    // Фильтр по дате претензии
    if (f.claimedPeriod && f.claimedPeriod.length === 2) {
      const [from, to] = f.claimedPeriod;
      if (!r.claimedOn) {
        return false;
      }
      if (r.claimedOn.isBefore(from, "day") || r.claimedOn.isAfter(to, "day")) {
        return false;
      }
    }
    
    // Фильтр по дате получения Застройщиком
    if (f.acceptedPeriod && f.acceptedPeriod.length === 2) {
      const [from, to] = f.acceptedPeriod;
      if (!r.acceptedOn) {
        return false;
      }
      if (r.acceptedOn.isBefore(from, "day") || r.acceptedOn.isAfter(to, "day")) {
        return false;
      }
    }
    
    // Фильтр по дате устранения
    if (f.resolvedPeriod && f.resolvedPeriod.length === 2) {
      const [from, to] = f.resolvedPeriod;
      if (!r.resolvedOn) {
        return false;
      }
      if (r.resolvedOn.isBefore(from, "day") || r.resolvedOn.isAfter(to, "day")) {
        return false;
      }
    }
    
    // Фильтр по судебной/досудебной претензии
    if (f.courtCase !== undefined && f.courtCase !== null && f.courtCase !== '') {
      const isCourtRelated = !!r.caseUid || !!r.pre_trial_claim;
      if (f.courtCase === 'true' && !isCourtRelated) {
        return false;
      }
      if (f.courtCase === 'false' && isCourtRelated) {
        return false;
      }
    }
    
    return true;
  });
  
  return result;
}
