import { Dayjs } from 'dayjs';

/** Набор фильтров для списка судебных дел */
export interface CourtCasesFiltersValues {
  ids?: number[];
  projectId?: number;
  /** Корпус */
  building?: string;
  objectId?: number;
  number?: string;
  dateRange?: [Dayjs, Dayjs];
  status?: number;
  plaintiff?: string;
  defendant?: string;
  fixStartRange?: [Dayjs, Dayjs];
  lawyerId?: string;
  hideClosed?: boolean;
}
