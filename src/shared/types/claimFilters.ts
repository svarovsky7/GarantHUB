import { Dayjs } from 'dayjs';

export interface ClaimFilters {
  id?: number[];
  project?: string;
  units?: string[];
  status?: string;
  responsible?: string;
  claim_no?: string;
  period?: [Dayjs, Dayjs];
}
