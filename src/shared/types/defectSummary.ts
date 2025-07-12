import type { Dayjs } from 'dayjs';

/**
 * Тип для представления defects_summary, содержащего сводную информацию о дефектах
 */
export interface DefectSummary {
  id: number;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  type_id: number | null;
  status_id: number | null;
  received_at: string | null;
  fixed_at: string | null;
  brigade_id: number | null;
  contractor_id: number | null;
  fixed_by: string | null;
  is_warranty: boolean | null;
  project_id: number | null;
  unit_id: number | null;
  created_by: string | null;
  updated_by: string | null;
  engineer_id: string | null;
  
  // Вычисляемые поля из представления
  project_name: string | null;
  unit_name: string | null;
  unit_building: string | null;
  unit_floor: number | null;
  type_name: string | null;
  status_name: string | null;
  status_color: string | null;
  brigade_name: string | null;
  contractor_name: string | null;
  engineer_name: string | null;
  fixed_by_name: string | null;
  attachments_count: number | null;
}

/**
 * Расширенный тип DefectSummary с удобными полями для работы в UI
 */
export interface DefectSummaryWithDayjs extends Omit<DefectSummary, 'received_at' | 'fixed_at' | 'created_at' | 'updated_at'> {
  // Даты как объекты Dayjs для удобной работы
  receivedAt: Dayjs | null;
  fixedAt: Dayjs | null;
  createdAt: Dayjs | null;
  updatedAt: Dayjs | null;
  
  // Алиасы для совместимости с существующим кодом
  projectName: string;
  unitName: string | null;
  unitBuilding: string | null;
  unitFloor: number | null;
  typeName: string | null;
  statusName: string;
  statusColor: string | null;
  brigadeName: string | null;
  contractorName: string | null;
  engineerName: string | null;
  fixedByName: string | null;
  
  // Дополнительные поля для UI
  attachments?: Array<any>;
  
  // Поля для совместимости
  defectTypeName?: string | null;
  defectStatusName?: string | null;
  defectStatusColor?: string | null;
}