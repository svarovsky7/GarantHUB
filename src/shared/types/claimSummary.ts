import type { Dayjs } from 'dayjs';

/**
 * Тип для представления claims_summary, содержащего сводную информацию о претензиях
 */
export interface ClaimSummary {
  id: number;
  project_id: number | null;
  claim_status_id: number | null;
  claim_no: string;
  claimed_on: string | null;
  accepted_on: string | null;
  registered_on: string | null;
  resolved_on: string | null;
  engineer_id: string | null;
  description: string | null;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  case_uid_id: number | null;
  pre_trial_claim: boolean | null;
  owner: string | null;
  
  // Вычисляемые поля из представления
  project_name: string | null;
  status_name: string | null;
  status_color: string | null;
  engineer_name: string | null;
  engineer_email: string | null;
  created_by_name: string | null;
  case_uid: string | null;
  attachments_count: number | null;
  units_count: number | null;
  defects_count: number | null;
  has_children: boolean | null;
  has_parent: boolean | null;
}

/**
 * Расширенный тип ClaimSummary с удобными полями для работы в UI
 */
export interface ClaimSummaryWithDayjs extends Omit<ClaimSummary, 'claimed_on' | 'accepted_on' | 'registered_on' | 'resolved_on' | 'created_at'> {
  // Даты как объекты Dayjs для удобной работы
  claimedOn: Dayjs | null;
  acceptedOn: Dayjs | null;
  registeredOn: Dayjs | null;
  resolvedOn: Dayjs | null;
  createdAt: Dayjs | null;
  
  // Алиасы для совместимости с существующим кодом
  projectName: string;
  statusName: string;
  statusColor: string | null;
  responsibleEngineerName: string | null;
  caseUid: string | null;
  createdByName: string | null;
  
  // Дополнительные поля для UI
  unitNames?: string;
  unitNumbers?: string;
  buildings?: string;
  attachments?: import('./claimFile').RemoteClaimFile[];
  hasCheckingDefect?: boolean;
  
  // ID массивы для совместимости
  unit_ids?: number[];
  defect_ids?: number[];
  parent_id?: number | null;
}