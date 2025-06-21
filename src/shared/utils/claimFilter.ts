import { ClaimFilters } from '@/shared/types/claimFilters';
import { Dayjs } from 'dayjs';

export function filterClaims<T extends {
  id: number;
  projectName?: string;
  unitNames?: string;
  unitNumbers?: string;
  statusName?: string;
  responsibleEngineerName?: string | null;
  claim_no?: string;
  registeredOn?: Dayjs | null;
}>(rows: T[], f: ClaimFilters): T[] {
  return rows.filter((r) => {
    if (f.id && f.id.length > 0 && !f.id.includes(r.id)) return false;
    if (f.project && r.projectName !== f.project) return false;
    if (f.units && f.units.length > 0 && r.unitNumbers) {
      const units = r.unitNumbers.split(',').map((u) => u.trim());
      const ok = f.units.every((u) => units.includes(u));
      if (!ok) return false;
    }
    if (f.status && r.statusName !== f.status) return false;
    if (f.responsible && r.responsibleEngineerName !== f.responsible) return false;
    if (f.claim_no && (!r.claim_no || !r.claim_no.includes(f.claim_no))) return false;
    if (f.description && (!r.description || !r.description.includes(f.description))) return false;
    if (f.hideClosed && /закры/i.test(r.statusName || '')) return false;
    if (f.period && f.period.length === 2) {
      const [from, to] = f.period;
      if (!r.registeredOn) return false;
      if (r.registeredOn.isBefore(from, 'day') || r.registeredOn.isAfter(to, 'day')) return false;
    }
    return true;
  });
}
