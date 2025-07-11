import { Dayjs } from 'dayjs';

/** Набор фильтров для списка дефектов */
export interface DefectFilters {
  id?: number[];
  ticketId?: number[];
  /** Связанные претензии */
  claimId?: number[];
  units?: number[];
  projectId?: number[];
  typeId?: number[];
  statusId?: number[];
  /** Автор создания */
  author?: string;
  fixBy?: string[];
  engineer?: string;
  /** Корпус */
  building?: string[];
  /** Период получения */
  period?: [Dayjs, Dayjs];
  /** Период создания */
  createdPeriod?: [Dayjs, Dayjs];
  /** Период устранения */
  fixedPeriod?: [Dayjs, Dayjs];
  hideClosed?: boolean;
  /** Фильтр по наличию файлов */
  hasFiles?: 'with' | 'without';
}
