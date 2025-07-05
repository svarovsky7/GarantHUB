
export interface Defect {
  id: number;
  /** Наименование недостатка */
  description: string;
  /** Тип дефекта */
  type_id: number | null;
  /** Статус дефекта */
  status_id: number | null;
  /** Дата получения */
  received_at: string | null;
  /** Дата устранения */
  fixed_at: string | null;
}

export type CaseStatus = 'active' | 'won' | 'lost' | 'settled';

export interface CourtCase {
  id: number;
  /** Идентификатор родительского дела */
  parent_id?: number | null;
  project_id: number;
  /** Ссылка на уникальный идентификатор дела */
  case_uid_id?: number | null;
  /** Уникальный идентификатор дела */
  caseUid?: string | null;
  /** Идентификаторы объектов проекта */
  unit_ids: number[];
  date: string;
  number: string;
  responsible_lawyer_id: string | null;
  status: number;
  /** Общая сумма исковых требований */
  total_claim_amount?: number | null;
  /** Автор создания записи */
  created_by?: string | null;
  /** Дата создания записи */
  created_at?: string;
  /** Автор последнего изменения */
  updated_by?: string | null;
  /** Дата последнего изменения */
  updated_at?: string;
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
