export interface DefectWithNames {
  id: number;
  description: string;
  defect_type_id: number | null;
  defect_status_id: number | null;
  brigade_id: number | null;
  contractor_id: number | null;
  received_at: string | null;
  fixed_at: string | null;
  fixed_by: string | null;
  defectTypeName: string | null;
  defectStatusName: string | null;
  fixedByUserName?: string | null;
}
