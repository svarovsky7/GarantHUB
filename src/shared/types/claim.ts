export interface Claim {
  /** Уникальный идентификатор претензии */
  id: number;
  /** Идентификатор родительской претензии */
  parent_id?: number | null;
  /** Проект, к которому относится претензия */
  project_id: number;
  /** Задействованные объекты */
  unit_ids: number[];
  /** Статус претензии */
  claim_status_id: number | null;
  /** Внутренний номер претензии */
  claim_no: string;
  /** Дата обнаружения дефекта */
  claimed_on: string | null;
  /** Дата принятия претензии застройщиком */
  accepted_on: string | null;
  /** Дата регистрации претензии в системе */
  registered_on: string | null;
  /** Дата фактического устранения */
  resolved_on: string | null;
  /** Ответственный инженер */
  engineer_id: string | null;
  /** Связанные тикеты-дефекты */
  ticket_ids?: number[];
  /** Дополнительное описание */
  description?: string;
  /** Идентификаторы файлов */
  attachment_ids?: number[];
  /** Автор создания */
  created_by?: string;
  /** Дата создания */
  created_at?: string;
  /** Автор последнего обновления */
  updated_by?: string;
  /** Дата обновления */
  updated_at?: string;
}

/** Связь претензий: parent_id - родительская, child_id - дочерняя */
export interface ClaimLink {
  /** Уникальный идентификатор связи */
  id: string;
  /** Идентификатор родительской претензии */
  parent_id: string;
  /** Идентификатор дочерней претензии */
  child_id: string;
}
