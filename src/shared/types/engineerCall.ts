import type { Dayjs } from 'dayjs';

export interface EngineerCall {
  id: string;
  project_id: number;
  title: string;
  description?: string | null;
  start_datetime: string;
  end_datetime: string;
  engineer_id?: string | null;
  unit_id?: number | null;
  claim_id?: number | null;
  status: string; // Теперь статус - строка из БД
  location?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EngineerCallWithNames extends EngineerCall {
  engineer_name?: string | null;
  unit_name?: string | null;
  claim_number?: string | null;
  created_by_name?: string | null;
  project_name?: string | null;
}

export interface EngineerCallFormData {
  title: string;
  start_datetime: Date | Dayjs;
  end_datetime: Date | Dayjs;
  project_id?: number;
  engineer_id?: string;
  unit_id?: number;
  claim_id?: number;
  status: string; // Теперь статус - строка из БД
  notes?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: EngineerCallWithNames;
  color?: string;
}