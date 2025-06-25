import { Dayjs } from 'dayjs';

export interface ClaimFilters {
  id?: number[];
  project?: string;
  units?: string[];
  /** Корпус */
  building?: string;
  status?: string;
  responsible?: string;
  claim_no?: string;
  /** Поиск в поле дополнительной информации */
  description?: string;
  /** Скрывать записи со статусом "Закрыто" */
  hideClosed?: boolean;
  period?: [Dayjs, Dayjs];
}
