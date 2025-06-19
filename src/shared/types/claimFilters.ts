import { Dayjs } from 'dayjs';

export interface ClaimFilters {
  id?: number[];
  project?: string;
  units?: string[];
  status?: string;
  responsible?: string;
  number?: string;
  period?: [Dayjs, Dayjs];
}
