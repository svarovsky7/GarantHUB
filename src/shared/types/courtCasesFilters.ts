import { Dayjs } from 'dayjs';

/** Набор фильтров для списка судебных дел */
export interface CourtCasesFiltersValues {
  ids?: number[];
  projectId?: number;
  /** Корпус */
  building?: string;
  objectId?: number;
  number?: string;
  /** Уникальный идентификатор */
  uid?: string;
  /** Истцы/Ответчики */
  parties?: string;
  dateRange?: [Dayjs, Dayjs];
  status?: number;
  fixStartRange?: [Dayjs, Dayjs];
  lawyerId?: string;
  description?: string;
  hideClosed?: boolean;
}
