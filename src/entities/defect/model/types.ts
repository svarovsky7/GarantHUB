export interface NewDefect {
  description: string;
  type_id: number | null;
  status_id: number | null;
  project_id: number | null;
  /** Основной объект */
  unit_id: number | null;
  brigade_id: number | null;
  contractor_id: number | null;
  /** Автор создания */
  created_by: string | null;
  is_warranty: boolean;
  received_at: string | null;
  fixed_at: string | null;
  fixed_by: string | null;
  engineer_id: string | null;
}
