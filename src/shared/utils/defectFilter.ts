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
  received_at: string | null;
  projectIds?: number[];
  defect_type_id: number | null;
  defect_status_id: number | null;
  defectStatusName?: string;
  fixByName?: string;
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
    if (
      Array.isArray(f.projectId) &&
      f.projectId.length > 0 &&
      !(d.projectIds || []).some((p) => f.projectId!.includes(p))
    ) {
      return false;
    }
    if (
      Array.isArray(f.typeId) &&
      f.typeId.length > 0 &&
      (d.defect_type_id == null || !f.typeId.includes(d.defect_type_id))
    ) {
      return false;
    }
    if (
      Array.isArray(f.statusId) &&
      f.statusId.length > 0 &&
      (d.defect_status_id == null || !f.statusId.includes(d.defect_status_id))
    ) {
      return false;
    }
    if (
      Array.isArray(f.fixBy) &&
      f.fixBy.length > 0 &&
      (!d.fixByName || !f.fixBy.includes(d.fixByName))
    ) {
      return false;
    }
    if (f.period && f.period.length === 2) {
      const [from, to] = f.period;
      const rec = dayjs(d.received_at);
      if (!rec.isSameOrAfter(from, 'day') || !rec.isSameOrBefore(to, 'day')) {
        return false;
      }
    }
    if (f.hideClosed && d.defectStatusName?.toLowerCase().includes('закры')) {
      return false;
    }
    return true;
  });
}
