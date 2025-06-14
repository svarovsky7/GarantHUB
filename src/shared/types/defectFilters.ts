import { Dayjs } from 'dayjs';

/** Набор фильтров для списка дефектов */
export interface DefectFilters {
  id?: number[];
  ticketId?: number[];
  project?: number;
  units?: number[];
  period?: [Dayjs, Dayjs];
}
