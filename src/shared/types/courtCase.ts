
export interface Defect {
  id: number;
  /** Наименование недостатка */
  description: string;
  /** Стоимость устранения */
  cost: number;
}

export type CaseStatus = 'active' | 'won' | 'lost' | 'settled';

export interface CourtCase {
  id: number;
  project_id: number;
  /** Идентификаторы объектов проекта */
  unit_ids: number[];
  date: string;
  number: string;
  plaintiff_id: number;
  defendant_id: number;
  responsible_lawyer_id: string | null;
  status: number;
  /** признак закрытого дела */
  is_closed: boolean;
  fix_start_date?: string | null;
  fix_end_date?: string | null;
  description: string;
  /** Ссылки на загруженные файлы */
  attachment_ids?: number[];
  defects: Defect[];
}
