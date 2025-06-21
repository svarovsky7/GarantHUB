import { Dayjs } from 'dayjs';

/** Набор фильтров для списка замечаний. */
export interface TicketFilters {
  id?: number[];
  hideClosed?: boolean;
  period?: [Dayjs, Dayjs];
  requestPeriod?: [Dayjs, Dayjs];
  requestNo?: string;
  project?: string;
  units?: string[];
  status?: string;
  responsible?: string;
}
