export interface Ticket {
  id: number;
  /** Идентификатор родительского замечания */
  parent_id?: number | null;
  project_id: number;
  /** массив ID объектов, к которым относится замечание */
  unit_ids: number[];
  status_id: number | null;
  title: string;
  description: string | null;
  customer_request_no: string | null;
  customer_request_date: string | null;
  responsible_engineer_id: string | null;
  is_warranty: boolean;
  /** признак закрытого замечания */
  is_closed: boolean;
  received_at: string;
  fixed_at: string | null;
  attachment_ids?: number[];
  defect_ids?: number[];
}

/** Связь замечаний: parent_id - родительское замечание, child_id - дочернее */
export interface TicketLink {
  /** Уникальный идентификатор связи */
  id: string;
  /** Идентификатор родительского замечания */
  parent_id: string;
  /** Идентификатор дочернего замечания */
  child_id: string;
}
