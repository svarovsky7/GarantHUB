import { Dayjs } from 'dayjs';

export interface ClaimFilters {
  id?: number[];
  project?: string | string[];
  units?: string[];
  /** Корпус */
  building?: string | string[];
  status?: string;
  responsible?: string;
  /** Автор создания */
  author?: string;
  claim_no?: string;
  /** Поиск в поле дополнительной информации */
  description?: string;
  /** Скрывать записи со статусом "Закрыто" */
  hideClosed?: boolean;
  period?: [Dayjs, Dayjs];
  /** Период дат претензии */
  claimedPeriod?: [Dayjs, Dayjs];
  /** Период получения застройщиком */
  acceptedPeriod?: [Dayjs, Dayjs];
  /** Период устранения дефекта */
  resolvedPeriod?: [Dayjs, Dayjs];
}
