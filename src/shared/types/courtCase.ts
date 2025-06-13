
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
  /** Идентификатор родительского дела */
  parent_id?: number | null;
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

/** Связь дел: parent_id - родительское дело, child_id - дочернее */
export interface CourtCaseLink {
  /** Уникальный идентификатор связи */
  id: string;
  /** Идентификатор родительского дела */
  parent_id: string;
  /** Идентификатор дочернего дела */
  child_id: string;
}
