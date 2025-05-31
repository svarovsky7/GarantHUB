export interface DefectDeadline {
  id: number;
  project_id: number;
  ticket_type_id: number;
  fix_days: number;
  project?: { id: number; name: string } | null;
  ticket_type?: { id: number; name: string } | null;
}
