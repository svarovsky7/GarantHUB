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
  fixStartRange?: [Dayjs, Dayjs];
  lawyerId?: string;
  /** Уникальный идентификатор */
  caseUid?: string;
  /** Поиск по сторонам дела */
  parties?: string;
  /** Поиск по описанию */
  description?: string;
  hideClosed?: boolean;
}
