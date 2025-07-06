import { Dayjs } from 'dayjs';

/** Набор фильтров для списка дефектов */
export interface DefectFilters {
  id?: number[];
  /** ID претензии */
  claimId?: number[];
  units?: number[];
  projectId?: number[];
  typeId?: number[];
  statusId?: number[];
  fixBy?: string[];
  engineer?: string;
  /** Автор дефекта */
  author?: string[];
  /** Корпус */
  building?: string[];
  /** Дата получения */
  period?: [Dayjs, Dayjs];
  /** Дата создания */
  createdPeriod?: [Dayjs, Dayjs];
  /** Дата устранения */
  fixedPeriod?: [Dayjs, Dayjs];
  /** Поиск по описанию */
  description?: string;
  hideClosed?: boolean;
}
