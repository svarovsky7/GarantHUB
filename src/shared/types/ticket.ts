export interface Ticket {
  id: number;
  project_id: number;
  /** массив ID объектов, к которым относится замечание */
  unit_ids: number[];
  type_id: number | null;
  status_id: number | null;
  title: string;
  description: string | null;
  customer_request_no: string | null;
  customer_request_date: string | null;
  responsible_engineer_id: string | null;
  is_warranty: boolean;
  received_at: string;
  fixed_at: string | null;
  attachment_ids?: number[];
}
