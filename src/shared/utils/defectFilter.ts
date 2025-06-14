import dayjs from 'dayjs';
import type { DefectFilters } from '@/shared/types/defectFilters';

/**
 * Фильтрация массива дефектов согласно активным фильтрам.
 * Возвращает только те записи, которые удовлетворяют условиям.
 */
export function filterDefects<T extends {
  id: number;
  ticketIds: number[];
  unitIds: number[];
  created_at: string | null;
}>(rows: T[], f: DefectFilters): T[] {
  return rows.filter((d) => {
    if (Array.isArray(f.id) && f.id.length > 0 && !f.id.includes(d.id)) {
      return false;
    }
    if (
      Array.isArray(f.ticketId) &&
      f.ticketId.length > 0 &&
      !d.ticketIds.some((t) => f.ticketId!.includes(t))
    ) {
      return false;
    }
    if (
      Array.isArray(f.units) &&
      f.units.length > 0 &&
      !d.unitIds.some((u) => f.units!.includes(u))
    ) {
      return false;
    }
    if (f.period && f.period.length === 2) {
      const [from, to] = f.period;
      const created = dayjs(d.created_at);
      if (!created.isSameOrAfter(from, 'day') || !created.isSameOrBefore(to, 'day')) {
        return false;
      }
    }
    return true;
  });
}
