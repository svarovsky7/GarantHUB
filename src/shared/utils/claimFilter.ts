import { ClaimFilters } from '@/shared/types/claimFilters';
import { Dayjs } from 'dayjs';

export function filterClaims<T extends {
  id: number;
  projectName?: string;
  unitNames?: string;
  statusName?: string;
  responsibleEngineerName?: string | null;
  number?: string;
  registeredAt?: Dayjs | null;
}>(rows: T[], f: ClaimFilters): T[] {
  return rows.filter((r) => {
    if (f.id && f.id.length > 0 && !f.id.includes(r.id)) return false;
    if (f.project && r.projectName !== f.project) return false;
    if (f.units && f.units.length > 0 && r.unitNames) {
      const units = r.unitNames.split(',').map((u) => u.trim());
      const ok = f.units.every((u) => units.includes(u));
      if (!ok) return false;
    }
    if (f.status && r.statusName !== f.status) return false;
    if (f.responsible && r.responsibleEngineerName !== f.responsible) return false;
    if (f.number && (!r.number || !r.number.includes(f.number))) return false;
    if (f.period && f.period.length === 2) {
      const [from, to] = f.period;
      if (!r.registeredAt) return false;
      if (r.registeredAt.isBefore(from, 'day') || r.registeredAt.isAfter(to, 'day')) return false;
    }
    return true;
  });
}
