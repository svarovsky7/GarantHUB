import dayjs from 'dayjs';
import type { DefectFilters } from '@/shared/types/defectFilters';

/**
 * Фильтрация массива дефектов согласно активным фильтрам.
 * Возвращает только те записи, которые удовлетворяют условиям.
 */
export function filterDefects<T extends {
  id: number;
  unitIds: number[];
  created_at: string | null;
  received_at: string | null;
  fixed_at: string | null;
  projectIds?: number[];
  type_id: number | null;
  status_id: number | null;
  defectStatusName?: string;
  fixByName?: string;
  engineerName?: string | null;
  buildingNamesList?: string[];
  claimIds: number[];
  createdByName?: string | null;
  filesCount?: number;
}>(rows: T[], f: DefectFilters): T[] {
  return rows.filter((d) => {
    if (Array.isArray(f.id) && f.id.length > 0 && !f.id.includes(d.id)) {
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
      Array.isArray(f.building) &&
      f.building.length > 0 &&
      (!d.buildingNamesList || !d.buildingNamesList.some((b) => f.building!.includes(b)))
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
      (d.type_id == null || !f.typeId.includes(d.type_id))
    ) {
      return false;
    }
    if (
      Array.isArray(f.statusId) &&
      f.statusId.length > 0 &&
      (d.status_id == null || !f.statusId.includes(d.status_id))
    ) {
      return false;
    }
    if (
      Array.isArray(f.claimId) &&
      f.claimId.length > 0 &&
      !d.claimIds.some((c) => f.claimId!.includes(c))
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
    if (f.author && d.createdByName !== f.author) {
      return false;
    }
    if (f.engineer && d.engineerName !== f.engineer) {
      return false;
    }
    if (f.period && f.period.length === 2) {
      const [from, to] = f.period;
      const rec = dayjs(d.received_at);
      if (!rec.isSameOrAfter(from, 'day') || !rec.isSameOrBefore(to, 'day')) {
        return false;
      }
    }
    if (f.createdPeriod && f.createdPeriod.length === 2) {
      const [from, to] = f.createdPeriod;
      const created = dayjs(d.created_at);
      if (!created.isSameOrAfter(from, 'day') || !created.isSameOrBefore(to, 'day')) {
        return false;
      }
    }
    if (f.fixedPeriod && f.fixedPeriod.length === 2) {
      const [from, to] = f.fixedPeriod;
      const fixed = dayjs(d.fixed_at);
      if (!fixed.isSameOrAfter(from, 'day') || !fixed.isSameOrBefore(to, 'day')) {
        return false;
      }
    }
    if (f.hideClosed && d.defectStatusName?.toLowerCase().includes('закры')) {
      return false;
    }
    if (f.hasFiles === 'with' && (!d.filesCount || d.filesCount === 0)) {
      return false;
    }
    if (f.hasFiles === 'without' && d.filesCount && d.filesCount > 0) {
      return false;
    }
    return true;
  });
}
