export interface DefectWithNames {
  id: number;
  description: string;
  type_id: number | null;
  status_id: number | null;
  brigade_id: number | null;
  contractor_id: number | null;
  is_warranty: boolean;
  received_at: string | null;
  fixed_at: string | null;
  fixed_by: string | null;
  engineer_id: string | null;
  defectTypeName: string | null;
  defectStatusName: string | null;
  defectStatusColor: string | null;
  fixedByUserName?: string | null;
  engineerName?: string | null;
}
