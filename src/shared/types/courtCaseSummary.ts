import type { Dayjs } from 'dayjs';

/**
 * Тип для представления court_cases_summary, содержащего сводную информацию о судебных делах
 */
export interface CourtCaseSummary {
  id: number;
  project_id: number;
  status: number;
  responsible_lawyer_id: string | null;
  fix_start_date: string | null;
  fix_end_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  date: string | null;
  number: string | null;
  description: string | null;
  case_uid_id: number | null;
  created_by: string | null;
  total_claim_amount: number | null;
  
  // Вычисляемые поля из представления
  project_name: string | null;
  status_name: string | null;
  status_color: string | null;
  lawyer_name: string | null;
  lawyer_email: string | null;
  case_uid: string | null;
  attachments_count: number | null;
  units_count: number | null;
  parties_count: number | null;
  claims_count: number | null;
}

/**
 * Расширенный тип CourtCaseSummary с удобными полями для работы в UI
 */
export interface CourtCaseSummaryWithDayjs extends Omit<CourtCaseSummary, 'fix_start_date' | 'fix_end_date' | 'created_at' | 'updated_at' | 'date'> {
  // Даты как объекты Dayjs для удобной работы
  fixStartDate: Dayjs | null;
  fixEndDate: Dayjs | null;
  createdAt: Dayjs | null;
  updatedAt: Dayjs | null;
  caseDate: Dayjs | null;
  
  // Алиасы для совместимости с существующим кодом
  projectName: string;
  statusName: string;
  statusColor: string | null;
  responsibleLawyerName: string | null;
  caseUid: string | null;
  
  // Дополнительные поля для UI
  unitNames?: string;
  unitNumbers?: string;
  buildings?: string;
  attachments?: Array<any>;
  
  // ID массивы для совместимости
  unit_ids?: number[];
  defect_ids?: number[];
  party_ids?: number[];
  claim_ids?: number[];
}