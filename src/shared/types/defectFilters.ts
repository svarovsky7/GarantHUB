import { Dayjs } from 'dayjs';

/** Набор фильтров для списка дефектов */
export interface DefectFilters {
  id?: number[];
  ticketId?: number[];
  units?: number[];
  projectId?: number[];
  typeId?: number[];
  statusId?: number[];
  fixBy?: string[];
  engineer?: string;
  /** Корпус */
  building?: string[];
  period?: [Dayjs, Dayjs];
  hideClosed?: boolean;
}
