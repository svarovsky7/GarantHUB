export interface DefectDeadline {
  id: number;
  project_id: number;
  defect_type_id: number;
  fix_days: number;
  project?: { id: number; name: string } | null;
  defect_type?: { id: number; name: string } | null;
}
