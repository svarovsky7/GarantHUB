export interface Claim {
  id: number;
  project_id: number;
  unit_ids: number[];
  status_id: number | null;
  number: string;
  claim_date: string | null;
  received_by_developer_at: string | null;
  /** Дата регистрации претензии */
  registered_at: string | null;
  fixed_at: string | null;
  responsible_engineer_id: string | null;
  defect_ids?: number[];
}
