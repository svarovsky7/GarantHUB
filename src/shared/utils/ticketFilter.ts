import { Dayjs } from 'dayjs';
import { TicketFilters } from '@/shared/types/ticketFilters';

/**
 * Фильтрация массива замечаний согласно заданным фильтрам.
 * Если корневое замечание удовлетворяет фильтрам, то все его дочерние
 * отображаются независимо от фильтров.
 *
 * @param rows массив замечаний
 * @param f активные фильтры
 */
export function filterTickets<T extends {
  id: number;
  parentId?: number | null;
  isClosed?: boolean;
  receivedAt?: Dayjs | null;
  customerRequestDate?: Dayjs | null;
  customerRequestNo?: string | null;
  projectName?: string;
  unitNames?: string;
  isWarranty?: boolean;
  statusName?: string;
  typeName?: string;
  responsibleEngineerName?: string | null;
}>(rows: T[], f: TicketFilters): T[] {
  const pass = (r: T): boolean => {
    if (Array.isArray(f.id) && f.id.length > 0 && !f.id.includes(r.id)) {
      return false;
    }
    if (f.hideClosed && r.isClosed) return false;
    if (f.period && f.period.length === 2) {
      const [from, to] = f.period;
      if (!r.receivedAt) return false;
      if (r.receivedAt.isBefore(from, 'day') || r.receivedAt.isAfter(to, 'day')) {
        return false;
      }
    }
    if (f.requestPeriod && f.requestPeriod.length === 2) {
      const [from, to] = f.requestPeriod;
      if (!r.customerRequestDate) return false;
      if (
        r.customerRequestDate.isBefore(from, 'day') ||
        r.customerRequestDate.isAfter(to, 'day')
      ) {
        return false;
      }
    }
    if (f.requestNo && r.customerRequestNo !== f.requestNo) return false;
    if (f.project && r.projectName !== f.project) return false;
    if (Array.isArray(f.units) && f.units.length > 0 && r.unitNames) {
      const rowUnits = r.unitNames.split(',').map((u) => u.trim());
      const hasMatch = f.units.some((u) => rowUnits.includes(u));
      if (!hasMatch) return false;
    }
    if (f.warranty) {
      const want = f.warranty === 'yes';
      if (r.isWarranty !== want) return false;
    }
    if (f.status && r.statusName !== f.status) return false;
    if (f.type && r.typeName !== f.type) return false;
    if (f.responsible && r.responsibleEngineerName !== f.responsible) {
      return false;
    }
    return true;
  };

  const childrenMap = new Map<number, T[]>();
  rows.forEach((row) => {
    if (row.parentId) {
      const pid = Number(row.parentId);
      const arr = childrenMap.get(pid) || [];
      arr.push(row);
      childrenMap.set(pid, arr);
    }
  });

  const result: T[] = [];
  const rootIds: number[] = [];
  rows.forEach((r) => {
    if (pass(r)) {
      result.push(r);
      if (!r.parentId) rootIds.push(r.id);
    }
  });

  const added = new Set<number>(result.map((r) => r.id));
  const addDescendants = (id: number) => {
    const kids = childrenMap.get(id);
    if (!kids) return;
    kids.forEach((c) => {
      if (!added.has(c.id)) {
        result.push(c);
        added.add(c.id);
        addDescendants(c.id);
      }
    });
  };
  rootIds.forEach(addDescendants);

  return result;
}
